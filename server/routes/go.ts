import { logger } from "../lib/logger";
import { Router } from "express";
import { db } from "../firebaseAdmin";
import { processClick } from "../services/clickTracking";
import { BanditEngine, TrafficContext } from "../services/banditEngine";
// Using crypto inside processClick

export const goRouter = Router();

const sanitizeParam = (param: any) => {
    if (typeof param !== 'string') return undefined;
    return param.trim().substring(0, 255);
}

// Smart Autonomous Routing via Contextual Multi-Armed Bandits
goRouter.get("/smart/:userId", async (req, res) => {
    const startTime = Date.now();
    const userId = req.params.userId;
    
    try {
        const source = sanitizeParam(req.query.source) || "unknown";
        const userAgent = req.headers['user-agent'] || "";
        let device = "desktop";
        if (userAgent.toLowerCase().includes("mobile")) device = "mobile";
        
        const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || "";
        const referer = req.headers['referer'];
        
        const currentHour = new Date().getHours();
        let timeOfDay = "evening";
        if (currentHour >= 5 && currentHour < 12) timeOfDay = "morning";
        else if (currentHour >= 12 && currentHour < 17) timeOfDay = "afternoon";

        const context: TrafficContext = {
            geo: "US", // In real prod, derive from IP (e.g. MaxMind)
            device,
            trafficSource: source,
            timeOfDay
        };

        // Get user's active offers to choose from
        const userOffersSnap = await db.collection("offers").where("userId", "==", userId).limit(25).get();
        if (userOffersSnap.empty) {
            return res.redirect(302, "/");
        }
        
        // Filter out any disabled or paused offers
        const activeDocs = userOffersSnap.docs.filter(doc => {
            const data = doc.data();
            return data.active !== false && data.status !== "inactive" && data.status !== "paused";
        });

        if (activeDocs.length === 0) {
            logger.warn(`[Smart Route] No active non-paused offers for user: ${userId}`);
            return res.redirect(302, "/");
        }
        
        const availableOffers = activeDocs.map(doc => doc.id);
        
        // Bandit RL system chooses the best offer for this specific traffic context
        const selectedOfferId = await BanditEngine.selectOffer(userId, context, availableOffers);
        
        const offerSnap = await db.collection("offers").doc(selectedOfferId).get();
        const offerData = offerSnap.data();
        let destinationUrl = offerData?.link;
        
        if (!destinationUrl || !destinationUrl.startsWith("https://")) {
            logger.error(`[Smart Route] Selected offer ${selectedOfferId} has non-HTTPS or missing destination URL: ${destinationUrl}`);
            return res.redirect(302, "/");
        }
        
        const countryHeader = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-geo-country'];
        const clickId = (countryHeader)
            ? await processClick(selectedOfferId, undefined, source, userAgent, ip, referer, undefined, countryHeader)
            : await processClick(selectedOfferId, undefined, source, userAgent, ip, referer);
        
        let finalDestinationUrl = destinationUrl;
        if (finalDestinationUrl.includes("#SUBID#")) {
            finalDestinationUrl = finalDestinationUrl.replace(/#SUBID#/g, clickId);
        } else if (finalDestinationUrl.includes("{clickid}")) {
            finalDestinationUrl = finalDestinationUrl.replace(/{clickid}/g, clickId);
        } else if (finalDestinationUrl.includes("{subid}")) {
            finalDestinationUrl = finalDestinationUrl.replace(/{subid}/g, clickId);
        } else if (offerData?.subIdParam) {
            try {
                const urlObj = new URL(finalDestinationUrl);
                urlObj.searchParams.set(offerData.subIdParam, clickId);
                finalDestinationUrl = urlObj.toString();
            } catch(e) {
                // ignore
            }
        }
        
        // Optimistically apply a negative reward (failure/click). If it converts later, postback updates with a positive reward.
        await BanditEngine.updateReward(userId, context, selectedOfferId, 0, false);
        
        logger.info(JSON.stringify({ event: "smart_click_redirect", clickId, selectedOfferId, latencyMs: Date.now() - startTime }));
        return res.redirect(302, finalDestinationUrl);

    } catch (e: any) {
        logger.error("Smart routing failed:", e);
        return res.redirect(302, "/");
    }
});

goRouter.get("/:offerId", async (req, res) => {
    const startTime = Date.now();
    const offerId = req.params.offerId;
    let destinationUrl = "/";
    let clickId = "";

    try {
        const articleId = sanitizeParam(req.query.articleId);
        const source = sanitizeParam(req.query.source);
        const pinId = sanitizeParam(req.query.pinId) || sanitizeParam(req.query.pin);
        const userAgent = req.headers['user-agent'];
        const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
        const referer = req.headers['referer'];

        // a. Validate offerId exists
        const offerSnap = await db.collection("offers").doc(offerId).get();
        if (!offerSnap.exists) {
            logger.warn(JSON.stringify({ event: "click_error", offerId, errorMessage: "Offer not found" }));
            return res.redirect(302, "/");
        }

        const offerData = offerSnap.data();
        if (offerData?.active === false || offerData?.status === "inactive" || offerData?.status === "paused") {
            logger.warn(JSON.stringify({ event: "click_error", offerId, errorMessage: "Offer is inactive or paused" }));
            return res.redirect(302, "/");
        }

        destinationUrl = offerData?.link;

        if (!destinationUrl || !destinationUrl.startsWith("https://")) {
            logger.error(JSON.stringify({ event: "click_error", offerId, errorMessage: "Invalid or non-HTTPS destination URL" }));
            return res.redirect(302, "/");
        }

        const countryHeader = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-geo-country'];
        clickId = (pinId || countryHeader)
            ? await processClick(offerId, articleId, source, userAgent, ip, referer, pinId, countryHeader)
            : await processClick(offerId, articleId, source, userAgent, ip, referer);

        // Inject SubID tracking parameter when offer link uses standard placeholders or subIdParam
        if (destinationUrl.includes("#SUBID#")) {
            destinationUrl = destinationUrl.replace(/#SUBID#/g, clickId);
        } else if (destinationUrl.includes("{clickid}")) {
            destinationUrl = destinationUrl.replace(/{clickid}/g, clickId);
        } else if (destinationUrl.includes("{subid}")) {
            destinationUrl = destinationUrl.replace(/{subid}/g, clickId);
        } else if (offerData?.subIdParam) {
            try {
                const urlObj = new URL(destinationUrl);
                urlObj.searchParams.set(offerData.subIdParam, clickId);
                destinationUrl = urlObj.toString();
            } catch(urlErr) {
                logger.warn(`Could not parse destinationUrl for SubID injection: ${destinationUrl}`);
            }
        }

    } catch (e: any) {
        logger.error(JSON.stringify({ event: "click_error", offerId, errorMessage: e.message }));
        try {
            db.collection("click_errors").add({
                clickId,
                offerId,
                error: e.message,
                stack: e.stack,
                timestamp: new Date()
            });
        } catch(err) {}
    }

    // Always redirect
    logger.info(JSON.stringify({ event: "click_redirect", clickId, offerId, latencyMs: Date.now() - startTime }));
    return res.redirect(302, destinationUrl);
});
