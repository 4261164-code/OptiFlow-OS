import { Router } from "express";
import { db } from "../../firebaseAdmin";

export const executiveApiRouter = Router();

// Assuming admin auth guard
const authGuard = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    next();
};

executiveApiRouter.get("/charts", authGuard, async (req, res) => {
    try {
        const { days } = req.query;
        const d = parseInt((days as string) || "30");
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - d);

        // Pre-aggregated check
        const dailyMetricsSnap = await db.collection("daily_metrics")
            .where("timestamp", ">=", fromDate.getTime())
            .get();

        if (!dailyMetricsSnap.empty) {
            console.log(`[Executive API] Serving charts from HIGH-SPEED pre-aggregated daily_metrics view!`);
            const dataByDate: Record<string, { date: string; revenue: number; clicks: number; conversions: number }> = {};
            
            // pre-populate last D days
            for (let i = 0; i < d; i++) {
                const temp = new Date();
                temp.setDate(temp.getDate() - i);
                const dateStr = temp.toISOString().split('T')[0];
                dataByDate[dateStr] = { date: dateStr, revenue: 0, clicks: 0, conversions: 0 };
            }

            dailyMetricsSnap.forEach(doc => {
                const data = doc.data();
                const dStr = data.date;
                if (dataByDate[dStr]) {
                    dataByDate[dStr].revenue = (dataByDate[dStr].revenue || 0) + Number(data.revenue || 0);
                    dataByDate[dStr].clicks = (dataByDate[dStr].clicks || 0) + Number(data.clicks || 0);
                    dataByDate[dStr].conversions = (dataByDate[dStr].conversions || 0) + Number(data.conversions || 0);
                }
            });

            return res.json(Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)));
        }

        console.log(`[Executive API] Falling back to slow runtime chart compilation on raw logs...`);

        // Fetch fallback data for charts
        const revSnap = await db.collection("revenue_events").where("timestamp", ">=", fromDate).get();
        const clicksSnap = await db.collection("affiliate_clicks").where("timestamp", ">=", fromDate).get();
        const convSnap = await db.collection("affiliate_conversions").where("status", "==", "confirmed").where("timestamp", ">=", fromDate).get();

        const dataByDate: Record<string, { date: string; revenue: number; clicks: number; conversions: number }> = {};

        // initialize empty buckets
        for (let i = 0; i < d; i++) {
            const temp = new Date();
            temp.setDate(temp.getDate() - i);
            const dateStr = temp.toISOString().split('T')[0];
            dataByDate[dateStr] = { date: dateStr, revenue: 0, clicks: 0, conversions: 0 };
        }

        revSnap.forEach(doc => {
            const data = doc.data();
            const dateStr = new Date(data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now())).toISOString().split('T')[0];
            if (dataByDate[dateStr]) {
                const amount = Number(data.amount || 0);
                if (data.type === "reversal") {
                    dataByDate[dateStr].revenue -= amount;
                } else {
                    dataByDate[dateStr].revenue += amount;
                }
            }
        });

        clicksSnap.forEach(doc => {
            const data = doc.data();
            const dateStr = new Date(data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now())).toISOString().split('T')[0];
            if (dataByDate[dateStr]) {
                dataByDate[dateStr].clicks += 1;
            }
        });

        convSnap.forEach(doc => {
            const data = doc.data();
            const dateStr = new Date(data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now())).toISOString().split('T')[0];
            if (dataByDate[dateStr]) {
                dataByDate[dateStr].conversions += 1;
            }
        });

        res.json(Object.values(dataByDate).sort((a,b) => a.date.localeCompare(b.date)));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.get("/rankings", authGuard, async (req, res) => {
    try {
        const { type } = req.query; // 'clusters', 'articles', 'offers'

        if (type === "clusters") {
            const metricsSnap = await db.collection("cluster_metrics").get();
            if (!metricsSnap.empty) {
                console.log(`[Executive API] Serving cluster rankings from cluster_metrics!`);
                const results = metricsSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: d.clusterId || doc.id,
                        clicks: d.clicks || 0,
                        conversions: d.conversions || 0,
                        revenue: d.revenue || 0,
                        conversionRate: d.conversionRate || 0
                    };
                }).sort((a, b) => b.revenue - a.revenue);
                return res.json(results);
            }

            // Fallback
            const snap = await db.collection("topic_clusters").limit(10).get();
            const results = snap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.keyword || doc.id,
                    clicks: d.clicks || 0,
                    conversions: d.conversions || 0,
                    revenue: d.revenueAttributed || 0,
                    conversionRate: d.clicks ? ((d.conversions || 0)/d.clicks)*100 : 0
                }
            }).sort((a, b) => b.revenue - a.revenue);
            return res.json(results);
        }

        if (type === "articles") {
            const metricsSnap = await db.collection("article_metrics").get();
            if (!metricsSnap.empty) {
                console.log(`[Executive API] Serving article rankings from article_metrics!`);
                const results = metricsSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: d.articleId,
                        name: d.name || `Article ${d.articleId}`,
                        clicks: d.clicks || 0,
                        conversions: d.conversions || 0,
                        revenue: d.revenue || 0,
                        conversionRate: d.conversionRate || 0
                    };
                }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
                return res.json(results);
            }

            // Fallback
            const clicksSnap = await db.collection("affiliate_clicks").orderBy("timestamp", "desc").limit(5000).get();
            const map: any = {};
            clicksSnap.forEach(doc => {
                const artId = doc.data().articleId || "unknown";
                if (!map[artId]) map[artId] = { clicks: 0, conversions: 0, revenue: 0 };
                map[artId].clicks++;
            });
            const convSnap = await db.collection("affiliate_conversions").orderBy("timestamp", "desc").limit(5000).get();
            convSnap.forEach(doc => {
                const artId = doc.data().articleId || "unknown";
                if (!map[artId]) map[artId] = { clicks: 0, conversions: 0, revenue: 0 };
                if (doc.data().status === "confirmed") map[artId].conversions++;
                if (doc.data().status === "confirmed") map[artId].revenue += Number(doc.data().amount || 0);
            });
            const results = Object.keys(map).map(id => ({
                id,
                name: "Article " + id,
                clicks: map[id].clicks,
                conversions: map[id].conversions,
                revenue: map[id].revenue,
                conversionRate: map[id].clicks ? (map[id].conversions / map[id].clicks)*100 : 0
            })).sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks).slice(0, 10);
            return res.json(results);
        }

        if (type === "offers") {
            const metricsSnap = await db.collection("offer_metrics").get();
            if (!metricsSnap.empty) {
                console.log(`[Executive API] Serving offer rankings from offer_metrics!`);
                const results = metricsSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: d.offerId,
                        name: d.name || `Offer ${d.offerId}`,
                        clicks: d.clicks || 0,
                        conversions: d.conversions || 0,
                        revenue: d.revenue || 0,
                        conversionRate: d.conversionRate || 0
                    };
                }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
                return res.json(results);
            }

            // Fallback
            const offersSnap = await db.collection("offers").get();
            const offerMap: any = {};
            offersSnap.forEach(doc => offerMap[doc.id] = doc.data().brand || doc.id);

            const convSnap = await db.collection("affiliate_conversions").where("status", "==", "confirmed").get();
            const map: any = {};
            convSnap.forEach(doc => {
                const offId = doc.data().offerId || "unknown";
                if (!map[offId]) map[offId] = { clicks: 0, conversions: 0, revenue: 0 };
                map[offId].conversions++;
                map[offId].revenue += Number(doc.data().amount || 0);
            });
            const clicksSnap = await db.collection("affiliate_clicks").get();
            clicksSnap.forEach(doc => {
                const offId = doc.data().offerId || "unknown";
                if (!map[offId]) map[offId] = { clicks: 0, conversions: 0, revenue: 0 };
                map[offId].clicks++;
            });

            const results = Object.keys(map).map(id => ({
                id,
                name: offerMap[id] || id,
                clicks: map[id].clicks,
                conversions: map[id].conversions,
                revenue: map[id].revenue,
                conversionRate: map[id].clicks ? (map[id].conversions / map[id].clicks)*100 : 0
            })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
            return res.json(results);
        }

        return res.json([]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
