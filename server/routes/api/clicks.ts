import { Router } from "express";
import { db } from "../../firebaseAdmin";

export const clicksApiRouter = Router();

clicksApiRouter.get("/analytics", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const { offerId, articleId, from, to } = req.query;

        let query: any = db.collection("affiliate_clicks").where("userId", "==", userId);
        
        if (offerId) query = query.where("offerId", "==", String(offerId));
        if (articleId) query = query.where("articleId", "==", String(articleId));
        
        if (from) query = query.where("timestamp", ">=", new Date(String(from)));
        if (to) query = query.where("timestamp", "<=", new Date(String(to)));

        query = query.limit(10001);

        // Get error count query declaration to parallelize both calls
        let errorQuery: any = db.collection("click_errors").where("userId", "==", userId);
        if (offerId) errorQuery = errorQuery.where("offerId", "==", String(offerId));
        if (from) errorQuery = errorQuery.where("timestamp", ">=", new Date(String(from)));
        if (to) errorQuery = errorQuery.where("timestamp", "<=", new Date(String(to)));

        const [snap, errSnap] = await Promise.all([
            query.get(),
            errorQuery.get()
        ]);

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
