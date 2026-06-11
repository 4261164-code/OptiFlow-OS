import { Router } from "express";
import { db } from "../firebaseAdmin";
import { processClick } from "../services/clickTracking";
// Using crypto inside processClick

export const goRouter = Router();

const sanitizeParam = (param: any) => {
    if (typeof param !== 'string') return undefined;
    return param.trim().substring(0, 255);
}

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
            console.warn(JSON.stringify({ event: "click_error", offerId, errorMessage: "Offer not found" }));
            return res.redirect(302, "/");
        }

        const offerData = offerSnap.data();
        destinationUrl = offerData?.link;

        if (!destinationUrl || !destinationUrl.startsWith("https://")) {
            console.error(JSON.stringify({ event: "click_error", offerId, errorMessage: "Invalid or non-HTTPS destination URL" }));
            return res.redirect(302, "/");
        }

        clickId = await processClick(offerId, articleId, source, userAgent, ip, referer, pinId);

    } catch (e: any) {
        console.error(JSON.stringify({ event: "click_error", offerId, errorMessage: e.message }));
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
    console.log(JSON.stringify({ event: "click_redirect", clickId, offerId, latencyMs: Date.now() - startTime }));
    return res.redirect(302, destinationUrl);
});
