import { logger } from "../../lib/logger";
import express from "express";
import crypto from "crypto";
import { db } from "../../firebaseAdmin";
import { logLedgerEvent } from "../../services/eventLedger";
import { BanditEngine } from "../../services/banditEngine";
import rateLimit from "express-rate-limit";
import { telemetryHub } from "../../services/telemetryStream";

export const postbackRouter = express.Router();

const postbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Too many requests to postback webhook, please try again later." }
});

export function verifyPostbackSignature(req: express.Request): boolean {
    const secret = process.env.POSTBACK_SECRET;
    
    // In development/test mode without a secret configured, allow requests
    if (!secret) {
        return true;
    }

    // Allow explicit test simulations if test header or query is present in non-production
    if (process.env.NODE_ENV !== 'production' && (req.query.test === 'true' || req.headers['x-simulation'] === 'true')) {
        return true;
    }

    // Secret query param check (standard network callback style: ?secret=...)
    const querySecret = req.query.secret;
    if (typeof querySecret === 'string' && querySecret.length === secret.length) {
        try {
            if (crypto.timingSafeEqual(Buffer.from(querySecret), Buffer.from(secret))) {
                return true;
            }
        } catch (e) {
            // continue to HMAC check
        }
    }

    // HMAC signature check (x-postback-signature header or ?signature=...)
    const signature = req.headers['x-postback-signature'] || req.query.signature || req.query.sig;
    if (!signature || typeof signature !== 'string') {
        return false;
    }

    // Canonical payload: stringified body or query string
    const payload = req.method === 'GET' 
        ? new URLSearchParams(req.query as any).toString()
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    try {
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        if (signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return true;
        }
    } catch (e) {
        return false;
    }

    return false;
}

export async function handlePostback(req: express.Request, res: express.Response) {
    try {
        if (!verifyPostbackSignature(req)) {
            logger.warn("[Postback Webhook] Rejected request with invalid or missing signature");
            return res.status(401).json({ error: "Missing or invalid postback signature" });
        }

        const body = req.body || {};
        const query = req.query || {};

        // Extract Click ID across multiple supported affiliate network conventions (SubID, sub1, sub2, clickId)
        const activeClickId = body.clickId || body.subId || body.subid || body.sub1 || body.sub2 ||
                              query.clickId || query.click_id || query.subId || query.subid || query.sub1 || query.sub2;

        if (!activeClickId || typeof activeClickId !== 'string' || activeClickId.length < 3) {
            return res.status(400).json({ error: "Missing required clickId or subid parameter for postback conversion" });
        }

        const rawAmount = body.amount ?? body.payout ?? query.amount ?? query.payout ?? 0;
        const activeAmount = Number(rawAmount);
        if (isNaN(activeAmount)) {
            return res.status(400).json({ error: "Invalid numeric payout amount" });
        }

        const currency = String(body.currency || query.currency || "USD").toUpperCase();
        if (!/^[A-Z]{3}$/.test(currency)) {
            return res.status(400).json({ error: "Invalid ISO-4217 currency code" });
        }

        const rawStatus = String(body.status || query.status || "confirmed").toLowerCase();
        const isReversal = rawStatus === "reversed" || rawStatus === "rejected" || rawStatus === "chargeback" || rawStatus === "refunded";
        const normalizedStatus = isReversal ? "reversed" : "confirmed";

        const rawTxId = body.transactionId || body.transId || body.txid || query.transactionId || query.transId || query.txid;
        const activeOfferId = body.offerId || query.offerId || query.offer_id || "unknown";

        // Generate stable, unique conversion ID for idempotency matching
        const conversionId = rawTxId ? `conv-${rawTxId}` : `conv-click-${activeClickId}`;

        // Sanitized log (do NOT log sensitive tokens or secrets)
        logger.info(`[Postback Webhook] Signal received: clickId=${activeClickId.substring(0, 16)}..., convId=${conversionId}, status=${normalizedStatus}, amount=${activeAmount} ${currency}`);

        // 1. Strict Idempotency Check
        const convRef = db.collection("affiliate_conversions").doc(conversionId);
        const convSnap = await convRef.get();

        if (convSnap.exists) {
            const existingData = convSnap.data() || {};
            // If already processed and status is unchanged, safely ignore duplicate
            if (existingData.status === normalizedStatus) {
                return res.json({
                    success: true,
                    status: "ignored",
                    message: "Duplicate conversion transaction already processed with identical status."
                });
            }

            // If transitioning from confirmed to reversed, process refund deduction
            if (existingData.status === "confirmed" && isReversal) {
                await convRef.update({
                    status: "reversed",
                    reversedAt: new Date(),
                    reversalReason: body.reason || query.reason || "Affiliate network reversal"
                });

                const userId = existingData.userId || "system-fallback";
                const { FieldValue } = await import("firebase-admin/firestore");
                const dateStr = new Date().toISOString().split("T")[0];

                // Deduct from daily metrics
                await db.collection("daily_metrics").doc(`${userId}_${dateStr}`).set({
                    conversions: FieldValue.increment(-1),
                    revenue: FieldValue.increment(-activeAmount),
                    updatedAt: Date.now()
                }, { merge: true });

                // Deduct from user stats if present
                try {
                    const userRef = db.collection("users").doc(userId);
                    const userSnap = await userRef.get();
                    if (userSnap.exists) {
                        const amountCents = Math.floor(activeAmount * 100);
                        await userRef.update({
                            balance: FieldValue.increment(-amountCents),
                            lifetimeEarned: FieldValue.increment(-amountCents),
                            updatedAt: Date.now()
                        });
                    }
                } catch (e) {}

                // Broadcast reversal to telemetry
                telemetryHub.recordEvent({
                    type: "conversion",
                    timestamp: Date.now(),
                    offerId: existingData.offerId,
                    offerName: `Reversal - ${existingData.offerId}`,
                    source: existingData.source || "affiliate",
                    country: existingData.country || "US",
                    device: "desktop",
                    payout: -activeAmount,
                    subid: activeClickId,
                    latencyMs: 10,
                });

                return res.json({
                    success: true,
                    status: "reversed",
                    conversionId,
                    message: "Conversion successfully reversed and metrics adjusted."
                });
            }
        }

        // 2. Click Matching Search: Check affiliate_clicks, and fallback to pending_click_events buffer
        let clickData: any = null;
        let clickDoc = await db.collection("affiliate_clicks").doc(activeClickId).get();
        if (clickDoc.exists) {
            clickData = clickDoc.data();
        } else {
            const pendingDoc = await db.collection("pending_click_events").doc(activeClickId).get();
            if (pendingDoc.exists) {
                clickData = pendingDoc.data();
            }
        }

        if (clickData) {
            // MATCH FOUND! Reconcile conversion immediately
            const userId = clickData.userId || "system-fallback";
            const articleId = clickData.articleId || "unknown";
            const pinId = clickData.pinId || "none";
            const source = clickData.source || "direct";
            const matchedOfferId = clickData.offerId || activeOfferId;
            const device = clickData.device || (clickData.userAgent?.toLowerCase().includes("mobile") ? "mobile" : "desktop");
            const country = clickData.country || "US";

            const currentHour = new Date(clickData.timestamp || Date.now()).getHours();
            let timeOfDay = "evening";
            if (currentHour >= 5 && currentHour < 12) timeOfDay = "morning";
            else if (currentHour >= 12 && currentHour < 17) timeOfDay = "afternoon";

            const context = {
                geo: country,
                device,
                trafficSource: source,
                timeOfDay
            };

            // Update contextual bandit engine with real conversion success + revenue
            if (!isReversal) {
                await BanditEngine.updateReward(userId, context, matchedOfferId, activeAmount, true);
            }

            // Append to ledger
            await logLedgerEvent({
                eventType: isReversal ? "refund" : "conversion",
                sourceId: conversionId,
                userId,
                offerId: matchedOfferId,
                articleId,
                pinId,
                source
            });

            await logLedgerEvent({
                eventType: "revenue",
                sourceId: conversionId,
                userId,
                offerId: matchedOfferId,
                articleId,
                pinId,
                amount: isReversal ? -activeAmount : activeAmount,
                source
            });

            // Write to revenue_events for real-time reporting
            const revenueEventId = `rev-evt-${Date.now()}-${conversionId}`;
            await db.collection("revenue_events").doc(revenueEventId).set({
                id: revenueEventId,
                conversionId,
                amount: isReversal ? -activeAmount : activeAmount,
                currency,
                type: isReversal ? "refund" : "payment",
                userId,
                offerId: matchedOfferId,
                articleId,
                timestamp: new Date()
            });

            // Persist the conversion record
            await convRef.set({
                conversionId,
                clickId: activeClickId,
                offerId: matchedOfferId,
                articleId,
                pinId,
                userId,
                amount: activeAmount,
                currency,
                status: normalizedStatus,
                source,
                country,
                device,
                timestamp: new Date()
            });

            // Broadcast to live telemetry stream
            telemetryHub.recordEvent({
                type: "conversion",
                timestamp: Date.now(),
                offerId: matchedOfferId,
                offerName: `Offer ${matchedOfferId}`,
                source,
                country,
                device,
                payout: isReversal ? -activeAmount : activeAmount,
                subid: activeClickId,
                latencyMs: 18,
            });

            // Update aggregated metrics
            const { FieldValue } = await import("firebase-admin/firestore");
            const dateStr = new Date().toISOString().split("T")[0];
            const multiplier = isReversal ? -1 : 1;

            await db.collection("daily_metrics").doc(`${userId}_${dateStr}`).set({
                conversions: FieldValue.increment(multiplier * 1),
                revenue: FieldValue.increment(multiplier * activeAmount),
                userId, date: dateStr, timestamp: Date.now()
            }, { merge: true });

            if (articleId && articleId !== "unknown") {
                await db.collection("article_metrics").doc(`${userId}_${articleId}`).set({
                    conversions: FieldValue.increment(multiplier * 1), 
                    revenue: FieldValue.increment(multiplier * activeAmount),
                    userId, articleId, timestamp: Date.now()
                }, { merge: true });
            }

            if (matchedOfferId && matchedOfferId !== "unknown") {
                await db.collection("offer_metrics").doc(`${userId}_${matchedOfferId}`).set({
                    conversions: FieldValue.increment(multiplier * 1), 
                    revenue: FieldValue.increment(multiplier * activeAmount),
                    userId, offerId: matchedOfferId, timestamp: Date.now()
                }, { merge: true });
            }

            // Also credit user balance if user has a financial earnings account
            if (!isReversal) {
                try {
                    const userRef = db.collection("users").doc(userId);
                    const userSnap = await userRef.get();
                    if (userSnap.exists) {
                        const amountCents = Math.floor(activeAmount * 100);
                        await userRef.update({
                            balance: FieldValue.increment(amountCents),
                            lifetimeEarned: FieldValue.increment(amountCents),
                            updatedAt: Date.now()
                        });
                    }
                } catch (e) {}
            }

            return res.json({
                success: true,
                status: isReversal ? "reversed" : "reconciled_immediately",
                conversionId,
                matchedDetails: { userId, offerId: matchedOfferId, articleId }
            });
        } else {
            // Click not found yet (replication delay or orphan signal)
            await db.collection("unreconciled_conversions").doc(conversionId).set({
                id: conversionId,
                conversionId,
                clickId: activeClickId,
                amount: activeAmount,
                currency,
                offerId: activeOfferId,
                status: "pending",
                retryCount: 0,
                timestamp: Date.now()
            });

            logger.info(`[Postback Webhook] No click immediately matched for clickId: ${activeClickId}. Queued in replication delay buffer.`);

            return res.json({
                success: true,
                status: "queued_for_reconciliation",
                conversionId,
                message: "Signal secured. Matching click not yet active. Queued for worker reconciliation."
            });
        }

    } catch (error: any) {
        logger.error("[Postback Webhook Error]", error.message);
        res.status(500).json({ error: error.message });
    }
}

// Support both POST and GET on /postback and root of router
postbackRouter.post("/postback", postbackLimiter, handlePostback);
postbackRouter.get("/postback", postbackLimiter, handlePostback);
postbackRouter.post("/", postbackLimiter, handlePostback);
postbackRouter.get("/", postbackLimiter, handlePostback);
