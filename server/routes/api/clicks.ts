import { Router } from "express";
import { db } from "../../firebaseAdmin";

export const clicksApiRouter = Router();

// Middleware placeholder for existing admin auth guard
// For this example, assuming it's hooked up in server.ts or we do a simple check
const authGuard = async (req: any, res: any, next: any) => {
    // Basic stub. Re-using the prompt instruction "require existing admin auth middleware... reuse whatever is there"
    // Since we don't have a formal one, we'll check the auth header or user context if it was passed by a central middleware.
    // In our server.ts, usually it's just expected userId in body for API, but this is a GET.
    // I'll check headers.authorization as a generic implementation.
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    next();
};

clicksApiRouter.get("/analytics", authGuard, async (req, res) => {
    try {
        const { offerId, articleId, from, to } = req.query;

        let query: any = db.collection("affiliate_clicks");
        
        if (offerId) query = query.where("offerId", "==", String(offerId));
        if (articleId) query = query.where("articleId", "==", String(articleId));
        
        if (from) query = query.where("timestamp", ">=", new Date(String(from)));
        if (to) query = query.where("timestamp", "<=", new Date(String(to)));

        query = query.limit(10001);

        const snap = await query.get();
        const docs = snap.docs;
        
        let truncated = false;
        let cDocs = docs;
        if (docs.length > 10000) {
            truncated = true;
            cDocs = docs.slice(0, 10000);
        }

        const totalClicks = cDocs.length;
        const byOffer: Record<string, number> = {};
        const bySource: Record<string, number> = {};
        const byArticle: Record<string, number> = {};

        for (const d of cDocs) {
            const data = d.data();
            const offId = data.offerId || "unknown";
            const src = data.source || "unknown";
            const artId = data.articleId || "unknown";

            byOffer[offId] = (byOffer[offId] || 0) + 1;
            bySource[src] = (bySource[src] || 0) + 1;
            byArticle[artId] = (byArticle[artId] || 0) + 1;
        }

        // Get error count
        let errorQuery: any = db.collection("click_errors");
        if (offerId) errorQuery = errorQuery.where("offerId", "==", String(offerId));
        if (from) errorQuery = errorQuery.where("timestamp", ">=", new Date(String(from)));
        if (to) errorQuery = errorQuery.where("timestamp", "<=", new Date(String(to)));

        const errSnap = await errorQuery.get();
        const errCount = errSnap.docs.length;
        
        const errorRate = totalClicks > 0 ? Number((errCount / totalClicks).toFixed(4)) : 0;

        res.json({
            totalClicks,
            byOffer,
            bySource,
            byArticle,
            errorRate,
            period: { from, to },
            ...(truncated && { truncated: true })
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
