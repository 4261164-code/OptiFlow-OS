import express from "express";
import crypto from "crypto";
import { db } from "../../firebaseAdmin";
import { logLedgerEvent } from "../../services/eventLedger";

export const postbackRouter = express.Router();

postbackRouter.post("/postback", async (req, res) => {
    try {
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

        console.log(`[Postback Webhook] Received conversion signal. Click ID: ${activeClickId}, conversion ID: ${conversionId}, payout: $${activeAmount}`);

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

            console.log(`[Postback Webhook] No click immediately matched for clickId: ${activeClickId}. Queued in replication delay buffer.`);

            return res.json({
                success: true,
                status: "queued_for_reconciliation",
                conversionId,
                message: "Signal secured. Matching click not yet active. Queued for eventual worker reconciliation."
            });
        }

    } catch (error: any) {
        console.error("[Postback Webhook Error]", error.message);
        res.status(500).json({ error: error.message });
    }
});
