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
        const userOffersSnap = await db.collection("offers").where("userId", "==", userId).limit(10).get();
        if (userOffersSnap.empty) {
            return res.redirect(302, "/");
        }
        
        const availableOffers = userOffersSnap.docs.map(doc => doc.id);
        
        // Bandit RL system chooses the best offer for this specific traffic context
        const selectedOfferId = await BanditEngine.selectOffer(userId, context, availableOffers);
        
        const offerSnap = await db.collection("offers").doc(selectedOfferId).get();
        const destinationUrl = offerSnap.data()?.link || "/";
        
        const clickId = await processClick(selectedOfferId, undefined, source, userAgent, ip, referer, undefined);
        
        let finalDestinationUrl = destinationUrl;
        try {
            const urlObj = new URL(finalDestinationUrl);
            urlObj.searchParams.set("s1", clickId);
            finalDestinationUrl = urlObj.toString();
        } catch(e) {
            // ignore
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
        destinationUrl = offerData?.link;

        if (!destinationUrl || !destinationUrl.startsWith("https://")) {
            logger.error(JSON.stringify({ event: "click_error", offerId, errorMessage: "Invalid or non-HTTPS destination URL" }));
            return res.redirect(302, "/");
        }

        clickId = await processClick(offerId, articleId, source, userAgent, ip, referer, pinId);

        // Inject SubID tracking parameter (s1 for MaxBounty/general network routing)
        try {
            const urlObj = new URL(destinationUrl);
            urlObj.searchParams.set("s1", clickId);
            destinationUrl = urlObj.toString();
        } catch(urlErr) {
            logger.warn(`Could not parse destinationUrl for SubID injection: ${destinationUrl}`);
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
