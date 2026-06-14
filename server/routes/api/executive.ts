import { logger } from "../../lib/logger";
import { Router } from "express";
import { db } from "../../firebaseAdmin";
import { runCEOSoul, runSEOSoul, generateCEOSpeech } from "../../agents";
import { RevenueEngine } from "../../services/revenueEngine";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";

export const executiveApiRouter = Router();

executiveApiRouter.post("/revenue/compound", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        
        const idempotencyKey = `compound-${userId}-${Date.now().toString().substring(0, 10)}`;
        const plan = Layer2Brain.formulateActionPlan({
            action: "COMPOUND_PROFIT",
            target: "revenue_engine",
            impact: "medium",
            reversibility: "low",
            factors: ["api_cost", "payment_impact"]
        });
        
        const topoResult = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
        if (!topoResult.success) return res.status(500).json({ error: topoResult.error });

        await RevenueEngine.executeCompoundingCycle(userId);
        res.json({ success: true, message: "Profit compounding cycle executed", auditLogId: topoResult.auditLogId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.get("/settings/get-ceo-name", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const snap = await db.collection("settings").doc(userId).get();
        const data = snap.exists ? snap.data() : {};
        res.json({ ceoName: data?.ceoName || "" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.post("/soul/chat", async (req: any, res: any) => {
    try {
        const { message, history } = req.body;
        const userId = req.user.uid;

        const idempotencyKey = `ceo-chat-${userId}-${Date.now()}`;
        const plan = Layer2Brain.formulateActionPlan({
            action: "EXECUTIVE_CHAT",
            target: "ceo_soul",
            impact: "low",
            reversibility: "high",
            factors: ["api_cost", "cache_only"]
        });
        
        const topoResult = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
        if (!topoResult.success) return res.status(500).json({ error: topoResult.error });

        const result = await runCEOSoul(message, history || [], userId);
        res.json({ ...result, auditLogId: topoResult.auditLogId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.post("/soul/seo-chat", async (req: any, res: any) => {
    try {
        const { message, history } = req.body;
        const userId = req.user.uid;

        const idempotencyKey = `seo-chat-${userId}-${Date.now()}`;
        const plan = Layer2Brain.formulateActionPlan({
            action: "EXECUTIVE_CHAT",
            target: "seo_soul",
            impact: "low",
            reversibility: "high",
            factors: ["api_cost", "cache_only"]
        });
        
        const topoResult = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
        if (!topoResult.success) return res.status(500).json({ error: topoResult.error });

        const result = await runSEOSoul(message, history || [], userId);
        res.json({ ...result, auditLogId: topoResult.auditLogId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.post("/soul/tts", async (req: any, res: any) => {
    try {
        const { text, voice } = req.body;
        const userId = req.user.uid;

        const idempotencyKey = `ceo-tts-${userId}-${Date.now()}`;
        const plan = Layer2Brain.formulateActionPlan({
            action: "EXECUTIVE_TTS",
            target: "ceo_soul",
            impact: "low",
            reversibility: "high",
            factors: ["api_cost", "cache_only"]
        });
        
        const topoResult = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
        if (!topoResult.success) return res.status(500).json({ error: topoResult.error });

        const audio = await generateCEOSpeech(text, voice || 'Kore', userId);
        if (!audio) return res.status(500).json({ error: "Failed to generate speech" });
        res.json({ audio, auditLogId: topoResult.auditLogId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- Strategic Memory and Targets ---

executiveApiRouter.get("/memory", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const snap = await db.collection("strategic_memory")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();
        const results = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        res.json(results);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.post("/memory", async (req: any, res: any) => {
    try {
        const { topic, insight, reliability, sourceAgent } = req.body;
        const userId = req.user.uid;
        const entry = {
            topic,
            insight,
            reliability: reliability || 0.8,
            sourceAgent: sourceAgent || "Manual Entry",
            userId,
            createdAt: Date.now()
        };
        const ref = await db.collection("strategic_memory").add(entry);
        res.json({ id: ref.id, ...entry });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.get("/targets", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const snap = await db.collection("ceo_targets")
            .where("userId", "==", userId)
            .orderBy("updatedAt", "desc")
            .get();
        const results = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        res.json(results);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.post("/targets", async (req: any, res: any) => {
    try {
        const { title, description, priority, metrics } = req.body;
        const userId = req.user.uid;
        const target = {
            title,
            description,
            status: "active",
            priority: priority || "medium",
            metrics: metrics || [],
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const ref = await db.collection("ceo_targets").add(target);
        res.json({ id: ref.id, ...target });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.patch("/targets/:id", async (req: any, res: any) => {
    try {
        const { status, metrics, priority } = req.body;
        const update: any = { updatedAt: Date.now() };
        if (status) update.status = status;
        if (metrics) update.metrics = metrics;
        if (priority) update.priority = priority;
        
        await db.collection("ceo_targets").doc(req.params.id).update(update);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.get("/nodes", async (req: any, res: any) => {
    try {
        // Mock organization state for UI visualization
        const nodes = [
            { id: '1', name: 'SEO Agent 01', role: 'Content Generator', type: 'agent', status: 'online', efficiency: 0.94, lastActive: Date.now() },
            { id: '2', name: 'Traffic Engine', role: 'Link Management', type: 'agent', status: 'online', efficiency: 0.88, lastActive: Date.now() - 5000 },
            { id: '3', name: 'Monetization AI', role: 'Offer Matching', type: 'agent', status: 'online', efficiency: 0.99, lastActive: Date.now() - 120000 },
            { id: '4', name: 'Image Studio', role: 'Visual Asset Creation', type: 'agent', status: 'offline', efficiency: 0.0, lastActive: Date.now() - 3600000 },
        ];
        res.json(nodes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

executiveApiRouter.get("/charts", async (req: any, res: any) => {
    try {
        const { days } = req.query;
        const userId = req.user.uid;
        const d = parseInt((days as string) || "30");
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - d);

        // Pre-aggregated check
        const dailyMetricsSnap = await db.collection("daily_metrics")
            .where("userId", "==", userId)
            .where("timestamp", ">=", fromDate.getTime())
            .get();

        if (!dailyMetricsSnap.empty) {
            logger.info(`[Executive API] Serving charts from HIGH-SPEED pre-aggregated daily_metrics view!`);
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

        logger.info(`[Executive API] Falling back to slow runtime chart compilation on raw logs...`);

        // Fetch fallback data for charts
        const [revSnap, clicksSnap, convSnap] = await Promise.all([
          db.collection("revenue_events").where("timestamp", ">=", fromDate).get(),
          db.collection("affiliate_clicks").where("timestamp", ">=", fromDate).get(),
          db.collection("affiliate_conversions").where("status", "==", "confirmed").where("timestamp", ">=", fromDate).get()
        ]);

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

executiveApiRouter.get("/rankings", async (req: any, res: any) => {
    try {
        const { type } = req.query; // 'clusters', 'articles', 'offers'

        if (type === "clusters") {
            const metricsSnap = await db.collection("cluster_metrics").get();
            if (!metricsSnap.empty) {
                logger.info(`[Executive API] Serving cluster rankings from cluster_metrics!`);
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
                logger.info(`[Executive API] Serving article rankings from article_metrics!`);
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
                logger.info(`[Executive API] Serving offer rankings from offer_metrics!`);
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
            const [offersSnap, convSnap, clicksSnap] = await Promise.all([
              db.collection("offers").get(),
              db.collection("affiliate_conversions").where("status", "==", "confirmed").get(),
              db.collection("affiliate_clicks").get()
            ]);
            const offerMap: any = {};
            offersSnap.forEach(doc => offerMap[doc.id] = doc.data().brand || doc.id);

            const map: any = {};
            convSnap.forEach(doc => {
                const offId = doc.data().offerId || "unknown";
                if (!map[offId]) map[offId] = { clicks: 0, conversions: 0, revenue: 0 };
                map[offId].conversions++;
                map[offId].revenue += Number(doc.data().amount || 0);
            });

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
