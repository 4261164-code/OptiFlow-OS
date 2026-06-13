import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";
import crypto from "crypto";

export async function processClick(
    offerId: string, 
    articleId: string | undefined, 
    source: string | undefined, 
    userAgent: string | undefined, 
    rawIp: string | undefined,
    referer: string | undefined,
    pinId?: string | undefined
): Promise<string> {
    const clickId = crypto.randomUUID();
    
    // Hash IP address with SHA-256
    const ipToHash = rawIp || "0.0.0.0";
    const ip = crypto.createHash("sha256").update(ipToHash).digest("hex");

    // Fire and forget to ensure eventual consistency and zero-latency redirect
    (async () => {
        try {
            let userId = "system-fallback";
            
            // Attempt to look up the associate userId from the offer or article
            const offerDoc = await db.collection("offers").doc(offerId).get();
            if (offerDoc.exists) {
                userId = offerDoc.data()?.userId || "system-fallback";
            } else if (articleId && articleId !== "unknown") {
                const articleDoc = await db.collection("articles").doc(articleId).get();
                if (articleDoc.exists) {
                    userId = articleDoc.data()?.userId || "system-fallback";
                }
            }

            const clickData = {
                clickId,
                offerId,
                articleId: articleId || "unknown",
                pinId: pinId || "none",
                timestamp: Date.now(),
                status: "pending" as const,
                userId,
                source: source || "direct",
                userAgent: userAgent || "unknown",
                ip,
                referer: referer || "none"
            };

            // Write to the Buffer collection pending_click_events
            await db.collection("pending_click_events").doc(clickId).set(clickData);
            logger.info(`[Click Buffer] Enqueued pending click event: ${clickId}`);
        } catch (error: any) {
            logger.error(`[Click Buffer Error] Failed to write click ${clickId} to buffer:`, error.message);
            try {
                await db.collection("click_errors").add({
                    clickId,
                    offerId,
                    error: `Click buffering failed: ${error.message}`,
                    stack: error.stack,
                    timestamp: new Date()
                });
            } catch (err) {
                logger.error("Failed to write to click_errors", err);
            }
        }
    })();

    return clickId;
}
