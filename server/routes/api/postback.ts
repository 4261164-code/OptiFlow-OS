import { logger } from "../../lib/logger";
import express from "express";
import crypto from "crypto";
import { db } from "../../firebaseAdmin";
import { logLedgerEvent } from "../../services/eventLedger";
import { BanditEngine } from "../../services/banditEngine";
import rateLimit from "express-rate-limit";

export const postbackRouter = express.Router();

const postbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Too many requests to postback webhook, please try again later." }
});

function verifyPostbackSignature(req: express.Request): boolean {
    const signature = req.headers['x-postback-signature'] || req.query.signature;
    if (!signature || typeof signature !== 'string') return false;
    
    const secret = process.env.POSTBACK_SECRET || 'default-insecure-secret';
    // When dealing with raw bodies, signature computation depends on the network.
    // Assuming simple JSON body stringification or query param computation.
    // This is a basic HMAC verification.
    const payload = JSON.stringify(req.body);
    try {
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch(e) {
        return false;
    }
}

postbackRouter.post("/postback", postbackLimiter, async (req, res) => {
    try {
        if (!verifyPostbackSignature(req)) {
            // Unsigned/invalid traffic fallback - we could route to manual review
            // For now, returning 401 as requested in Task 2.1
            return res.status(401).json({ error: "Missing or invalid postback signature" });
        }

        const { clickId, queryClickId, amount, affiliate, offerId, transactionId } = req.body;
        
        // Pick active click ID
        const activeClickId = clickId || queryClickId || req.query.clickId || req.query.click_id;
        const rawAmount = amount || req.query.amount || req.query.payout || 0;
        const activeAmount = Number(rawAmount);
        const activeOfferId = offerId || req.query.offerId || req.query.offer_id || "unknown";
        const rawTxId = transactionId || req.query.transactionId || req.query.txid || req.query.subid;
        
        // Generate stable, unique conversion ID for idempotency matching
        const conversionId = rawTxId ? `conv-${rawTxId}` : `conv-gen-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

        if (!activeClickId) {
            return res.status(400).json({ error: "Missing required clickId for postback conversion" });
        }

        logger.info(`[Postback Webhook] Received conversion signal. Click ID: ${activeClickId}, conversion ID: ${conversionId}, payout: $${activeAmount}`);

        // 1. Strict Idempotency check: Reject processed conversion ID duplicates
        const convSnap = await db.collection("affiliate_conversions").doc(conversionId).get();
        if (convSnap.exists) {
            return res.json({
                success: true,
                status: "ignored",
                message: "Duplicate conversion transaction ID already processed."
            });
        }

        const pendingSnap = await db.collection("unreconciled_conversions").doc(conversionId).get();
        if (pendingSnap.exists) {
            return res.json({
                success: true,
                status: "ignored",
                message: "This conversion in already queued in unmatched backlog."
            });
        }

        // 2. Real-time Click Matching Search
        const clickSnap = await db.collection("affiliate_clicks").doc(activeClickId).get();

        if (clickSnap.exists) {
            // MATCH FOUND! Store immediately
            const clickData = clickSnap.data() || {};
            const userId = clickData.userId || "system-fallback";
            const articleId = clickData.articleId || "unknown";
            const pinId = clickData.pinId || "none";
            const source = clickData.source || "direct";
            const matchedOfferId = clickData.offerId || activeOfferId;
            const device = clickData.userAgent?.toLowerCase().includes("mobile") ? "mobile" : "desktop";
            
            const currentHour = new Date(clickData.timestamp || Date.now()).getHours();
            let timeOfDay = "evening";
            if (currentHour >= 5 && currentHour < 12) timeOfDay = "morning";
            else if (currentHour >= 12 && currentHour < 17) timeOfDay = "afternoon";

            const context = {
                geo: "US", // Placeholder for actual IP derivation
                device,
                trafficSource: source,
                timeOfDay
            };

            // Update contextual bandit engine with real conversion success + revenue
            await BanditEngine.updateReward(userId, context, matchedOfferId, activeAmount, true);

            // Log appending to ledger
            await logLedgerEvent({
                eventType: "conversion",
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
                amount: activeAmount,
                source
            });

            // Write to revenue_events for real-time reporting compatibility
            const revenueEventId = `rev-evt-${Date.now()}-${conversionId}`;
            await db.collection("revenue_events").doc(revenueEventId).set({
                id: revenueEventId,
                conversionId,
                amount: activeAmount,
                type: "payment",
                userId,
                offerId: matchedOfferId,
                articleId,
                timestamp: new Date()
            });

            // Persist the conversion
            await db.collection("affiliate_conversions").doc(conversionId).set({
                conversionId,
                clickId: activeClickId,
                offerId: matchedOfferId,
                articleId,
                pinId,
                userId,
                amount: activeAmount,
                status: "confirmed",
                timestamp: new Date()
            });

            // Incremental aggregation
            const { FieldValue } = require("firebase-admin/firestore");
            const dateStr = new Date().toISOString().split("T")[0];
            await db.collection("daily_metrics").doc(`${userId}_${dateStr}`).set({
                conversions: FieldValue.increment(1),
                revenue: FieldValue.increment(activeAmount),
                userId, date: dateStr, timestamp: Date.now()
            }, { merge: true });

            if (articleId && articleId !== "unknown") {
                await db.collection("article_metrics").doc(`${userId}_${articleId}`).set({
                    conversions: FieldValue.increment(1), revenue: FieldValue.increment(activeAmount),
                    userId, articleId, timestamp: Date.now()
                }, { merge: true });
            }

            if (matchedOfferId && matchedOfferId !== "unknown") {
                await db.collection("offer_metrics").doc(`${userId}_${matchedOfferId}`).set({
                    conversions: FieldValue.increment(1), revenue: FieldValue.increment(activeAmount),
                    userId, offerId: matchedOfferId, timestamp: Date.now()
                }, { merge: true });
            }

            return res.json({
                success: true,
                status: "reconciled_immediately",
                conversionId,
                matchedDetails: { userId, offerId: matchedOfferId, articleId }
            });
        } else {
            // NO CLICK IN WORKSPACE YET! (Possible replication delay or orphan)
            // Log to Unreconciled queue for worker handling
            await db.collection("unreconciled_conversions").doc(conversionId).set({
                id: conversionId,
                conversionId,
                clickId: activeClickId,
                amount: activeAmount,
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
                message: "Signal secured. Matching click not yet active. Queued for eventual worker reconciliation."
            });
        }

    } catch (error: any) {
        logger.error("[Postback Webhook Error]", error.message);
        res.status(500).json({ error: error.message });
    }
});
