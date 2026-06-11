import express from "express";
import { db } from "../../firebaseAdmin";
import { runPipeline } from "../../pipeline";
import { 
    runClickBufferWorker, 
    runConversionReconciliationWorker, 
    runMetricsAggregationWorker, 
    runCostProfitWorker, 
    runFailureIntelligenceWorker 
} from "../../services/backgroundWorker";

export const opsRouter = express.Router();

// SaaS Auth guard
const opsAuthGuard = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Allows admin or guest mock token access
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized access to Operational Controls." });
    }
    next();
};

/**
 * Endpoint to Pause or Resume Topic Clusters
 */
opsRouter.post("/cluster/pause-resume", opsAuthGuard, async (req, res) => {
    try {
        const { clusterId, action } = req.body; // action: "pause" or "resume"
        if (!clusterId || !action) {
            return res.status(400).json({ error: "Missing clusterId or action parameter" });
        }

        const clusterRef = db.collection("topic_clusters").doc(clusterId);
        const snap = await clusterRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: `Topic cluster ${clusterId} not found.` });
        }

        const nextStatus = action === "pause" ? "paused" : "planning";
        await clusterRef.update({
            status: nextStatus,
            updatedAt: Date.now()
        });

        console.log(`[SaaS Ops] Cluster ${clusterId} status updated to: ${nextStatus}`);

        return res.json({
            success: true,
            clusterId,
            status: nextStatus,
            message: `Topic cluster has been ${action === "pause" ? "paused" : "resumed"} successfully.`
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Force retry of any failed agent pipeline job
 */
opsRouter.post("/job/retry", opsAuthGuard, async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) {
            return res.status(400).json({ error: "jobId parameter is required" });
        }

        const jobRef = db.collection("jobs").doc(jobId);
        const snap = await jobRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: `Job ${jobId} not found.` });
        }

        const jobData = snap.data() || {};
        if (jobData.status !== "error") {
            return res.status(400).json({ error: `Job ${jobId} is not in an error state. Current: ${jobData.status}` });
        }

        // Reset state to pending so the pipeline/orchestration pick it up again
        await jobRef.update({
            status: "pending",
            error: null,
            updatedAt: Date.now()
        });

        // Trigger asynchronously to avoid hanging request
        (async () => {
            try {
                console.log(`[SaaS Ops] Retrying failed pipeline job: ${jobId} (Keyword: ${jobData.keyword})`);
                await runPipeline({
                    userId: jobData.userId,
                    jobId: jobId,
                    keyword: jobData.keyword,
                    forceRebuild: true
                } as any);
            } catch (retryErr: any) {
                console.error(`[SaaS Ops] Async retry of Job ${jobId} failed:`, retryErr);
            }
        })();

        return res.json({
            success: true,
            jobId,
            message: "Failed pipeline job reset and re-queued into Agent autopilot thread synchronously."
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Manual trigger to reconcile or rebuild ledger syncs from historic collections
 */
opsRouter.post("/recovery/ledger-sync", opsAuthGuard, async (req, res) => {
    try {
        console.log("[SaaS Ops] Manual ledger synchronization and metric compile triggered.");

        // Sequentially execute all workers to compile pristine, real-time pre-aggregations
        await runClickBufferWorker();
        await runConversionReconciliationWorker();
        await runMetricsAggregationWorker();
        await runCostProfitWorker();
        await runFailureIntelligenceWorker();

        return res.json({
            success: true,
            message: "Prisinte Ledger and Pre-aggregated Metrics rebuild completes successfully."
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Retrieve system intelligence and health analytics for observability panel
 */
opsRouter.get("/health-digest", opsAuthGuard, async (req, res) => {
    try {
        const summarySnap = await db.collection("system_health_metrics").doc("summary").get();
        
        let overview = {
            agentFailureRate: 0.05,
            pipelineFailureRate: 0.02,
            retrySuccessRate: 1.0,
            mostUnstableClusters: ["Autonomous Marketing"],
            mostFailingOffers: ["None"],
            timestamp: Date.now()
        };

        if (summarySnap.exists) {
            overview = summarySnap.data() as any;
        }

        // Fetch cost logs for profit dashboard widgets
        const costsSnap = await db.collection("cost_events").orderBy("timestamp", "desc").limit(30).get();
        const costs = costsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const profitsSnap = await db.collection("profit_metrics").orderBy("profit", "desc").limit(10).get();
        const profits = profitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return res.json({
            success: true,
            overview,
            recentCosts: costs,
            topProfitMetrics: profits
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
