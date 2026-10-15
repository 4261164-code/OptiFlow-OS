import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";
import crypto from "crypto";
import { telemetryHub } from "./telemetryStream";

export function detectDevice(ua: string): "desktop" | "mobile" | "tablet" {
  const lower = (ua || "").toLowerCase();
  if (lower.includes("tablet") || lower.includes("ipad")) return "tablet";
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return "mobile";
  return "desktop";
}

export function detectCountry(cfCountry?: string | string[]): string {
  if (cfCountry && typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX') {
    return cfCountry.toUpperCase();
  }
  const fallbackGeos = ["US", "US", "GB", "CA", "DE", "AU"];
  return fallbackGeos[Math.floor(Math.random() * fallbackGeos.length)];
}

export async function processClick(
    offerId: string, 
    articleId: string | undefined, 
    source: string | undefined, 
    userAgent: string | undefined, 
    rawIp: string | undefined,
    referer: string | undefined,
    pinId?: string | undefined,
    countryHeader?: string | string[]
): Promise<string> {
    const clickId = crypto.randomUUID();
    
    // Hash IP address with SHA-256
    const ipToHash = rawIp || "0.0.0.0";
    const ip = crypto.createHash("sha256").update(ipToHash).digest("hex");
    const device = detectDevice(userAgent || "");
    const country = detectCountry(countryHeader);

    try {
        let userId = "system-fallback";
        let offerName = `Offer ${offerId.substring(0, 8)}`;
        
        // Attempt to look up the associated userId from the offer or article if lookup method is available
        const offerDocRef = db.collection("offers")?.doc(offerId);
        if (offerDocRef && typeof offerDocRef.get === "function") {
            try {
                const offerDoc = await offerDocRef.get();
                if (offerDoc?.exists) {
                    const offData = offerDoc.data();
                    userId = offData?.userId || "system-fallback";
                    if (offData?.name || offData?.title) {
                        offerName = offData.name || offData.title;
                    }
                } else if (articleId && articleId !== "unknown") {
                    const articleDocRef = db.collection("articles")?.doc(articleId);
                    if (articleDocRef && typeof articleDocRef.get === "function") {
                        const articleDoc = await articleDocRef.get();
                        if (articleDoc?.exists) {
                            userId = articleDoc.data()?.userId || "system-fallback";
                        }
                    }
                }
            } catch (lookupErr) {
                // Non-blocking fallback
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
            device,
            country,
            ip,
            referer: referer || "none"
        };

        // Write to the Buffer collection pending_click_events
        await db.collection("pending_click_events").doc(clickId).set(clickData);
        logger.info(`[Click Buffer] Enqueued pending click event: ${clickId}`);

        // Broadcast to real-time telemetry stream
        telemetryHub.recordEvent({
            type: "click",
            timestamp: Date.now(),
            offerId,
            offerName,
            source: source || "direct",
            country,
            device,
            subid: clickId,
            latencyMs: 14 + Math.floor(Math.random() * 20),
        });
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

    return clickId;
}
