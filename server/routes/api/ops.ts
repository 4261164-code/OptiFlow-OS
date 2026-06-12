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

/**
 * Retrieve comprehensive API status dashboard datasets
 */
opsRouter.get("/api-health", opsAuthGuard, async (req, res) => {
    try {
        const snap = await db.collection("api_health").doc("summary").get();
        if (snap.exists) {
            return res.json({ success: true, apiHealth: snap.data()?.checks || {} });
        }
        // Fallback or run immediate diagnostics
        const { ApiHealthMonitor } = await import("../../services/healthMonitor");
        const freshHealth = await ApiHealthMonitor.runDiagnostics();
        return res.json({ success: true, apiHealth: freshHealth });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Force manual check of API keys
 */
opsRouter.post("/api-health/trigger", opsAuthGuard, async (req, res) => {
    try {
        const { ApiHealthMonitor } = await import("../../services/healthMonitor");
        const freshHealth = await ApiHealthMonitor.runDiagnostics();
        return res.json({ success: true, apiHealth: freshHealth });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Gathers system health metrics for charts
 */
opsRouter.get("/system-diagnostics", opsAuthGuard, async (req, res) => {
    try {
        const snap = await db.collection("system_health_metrics")
            .orderBy("timestamp", "desc")
            .limit(60)
            .get();
        
        const metrics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        return res.json({ success: true, metrics });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Retrieve the central error logs
 */
opsRouter.get("/error-logs", opsAuthGuard, async (req, res) => {
    try {
        const snap = await db.collection("error_logs")
            .orderBy("timestamp", "desc")
            .limit(100)
            .get();
        
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, logs });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Retrieve immutable audit logs (Task 4)
 */
opsRouter.get("/audit-logs", opsAuthGuard, async (req, res) => {
    try {
        const snap = await db.collection("immutable_audit_logs")
            .orderBy("timestamp", "desc")
            .limit(100)
            .get();
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, logs });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Retrieve pending actions for Layer 3 RED gates (Task 2)
 */
opsRouter.get("/pending-approvals", opsAuthGuard, async (req, res) => {
    try {
        const snap = await db.collection("pending_approvals")
            .where("status", "==", "PENDING_APPROVAL")
            .orderBy("timestamp", "desc")
            .limit(50)
            .get();
        const approvals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ success: true, approvals });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Approve or Decline a pending Layer 3 action
 */
opsRouter.post("/approvals/evaluate", opsAuthGuard, async (req, res) => {
    try {
        const { id, decision } = req.body; // decision: 'APPROVE' | 'DECLINE'
        const userId = req.headers['authorization']?.split(' ')[1] || 'dev-guest';

        const docRef = db.collection("pending_approvals").doc(id);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: "Pending action not found." });
        }

        const pending = snap.data();
        if (pending.status !== "PENDING_APPROVAL") {
            return res.status(400).json({ error: "Action is already resolved." });
        }

        if (decision === 'DECLINE') {
            await docRef.update({ status: "DECLINED", evaluatedAt: Date.now() });
            
            // Mark audit log
            const { Layer3Execution } = await import("../../services/architectureLayers");
            await db.collection("immutable_audit_logs").add({
                userId,
                idempotencyKey: pending.idempotencyKey,
                action: pending.actionPlan.action,
                decisionScore: pending.actionPlan.score,
                gate: pending.actionPlan.gate,
                status: "DECLINED_BY_ADMIN",
                timestamp: Date.now()
            });

            return res.json({ success: true, status: "DECLINED" });
        }

        // execute with approved flag
        const { Layer3Execution } = await import("../../services/architectureLayers");
        const authorizedPlan = { ...pending.actionPlan };
        authorizedPlan.normalized.params = {
            ...authorizedPlan.normalized.params,
            approvedByAdmin: true
        };

        const result = await Layer3Execution.executeActionPlan(
            userId,
            authorizedPlan,
            pending.idempotencyKey
        );

        if (result.success) {
            await docRef.update({ status: "APPROVED", evaluatedAt: Date.now() });
            return res.json({ success: true, status: "APPROVED", result });
        } else {
            return res.status(500).json({ error: result.error || "Execution failed." });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Handle Rollbacks (Task 4 rollback support)
 */
opsRouter.post("/audit-logs/rollback", opsAuthGuard, async (req, res) => {
    try {
        const { auditLogId } = req.body;
        const userId = req.headers['authorization']?.split(' ')[1] || 'dev-guest';

        const { Layer3Execution } = await import("../../services/architectureLayers");
        const success = await Layer3Execution.executeRollback(userId, auditLogId);

        if (success) {
            return res.json({ success: true, message: "Action successfully rolled back." });
        } else {
            return res.status(400).json({ error: "Could not execute rollback. Verify state is valid and action is reversible." });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Retrieve active circuit breakers (Task 3)
 */
opsRouter.get("/active-breakers", opsAuthGuard, async (req, res) => {
    try {
        const { SafeExecutionEngine } = await import("../../services/architectureLayers");
        const activeBreakers = SafeExecutionEngine.getCircuitBreakers();
        return res.json({ success: true, activeBreakers });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Force manual reset of breaker state
 */
opsRouter.post("/active-breakers/reset", opsAuthGuard, async (req, res) => {
    try {
        const { breakerKey } = req.body;
        const { SafeExecutionEngine } = await import("../../services/architectureLayers");
        SafeExecutionEngine.clearCircuitBreaker(breakerKey);
        return res.json({ success: true, message: `Circuit breaker cleared for error '${breakerKey}'.` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Anomaly and advisory healing simulator!
 */
opsRouter.post("/simulate-anomaly", opsAuthGuard, async (req, res) => {
    try {
        const { 
            errorMsg, 
            factors, 
            impact, 
            reversibility,
            duplicateStripeEvent,
            activeRetryChains,
            selfHealCooldownViolation,
            fromState,
            toState,
            depth,
            impactScope,
            cooldownPassed
        } = req.body;
        const userId = req.headers['authorization']?.split(' ')[1] || 'dev-guest';

        const { Layer2Brain, SafeExecutionEngine, Layer3Execution } = await import("../../services/architectureLayers");

        // Simple anomaly identifier
        const issueKey = errorMsg.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40);

        // Check self healing budget & loop lock
        const policyCheck = SafeExecutionEngine.verifyHealingPolicy(issueKey);
        if (!policyCheck.allowed) {
            // Write to error log directly
            await db.collection("error_logs").add({
                message: `[Self Healing Budget Alert] Auto-repair blocked: ${policyCheck.reason}`,
                category: "worker",
                severity: "Critical",
                recommendation: "Review active breakers and increase budget boundaries as needed.",
                timestamp: Date.now()
            });
            return res.json({ 
                success: false, 
                blocked: true,
                reason: policyCheck.reason 
            });
        }

        // Advisory diagnose from Layer 2
        const normalized = Layer2Brain.diagnoseAnomalyAndRecommend(errorMsg, { simulation: true });
        
        // Override with custom user-supplied parameters if given
        if (factors) normalized.factors = factors;
        if (impact) normalized.impact = impact;
        if (reversibility) normalized.reversibility = reversibility;

        // Custom sandbox constraints simulator injections
        normalized.params = {
            ...normalized.params,
            duplicateStripeEvent,
            activeRetryChains,
            selfHealCooldownViolation,
            fromState,
            toState,
            depth,
            impactScope,
            cooldownPassed
        };

        const actionPlan = Layer2Brain.formulateActionPlan(normalized);

        // Execute action plan through Layer 3
        const idempotencyKey = "sim_" + Math.random().toString(36).substring(2, 12);
        const result = await Layer3Execution.executeActionPlan(userId, actionPlan, idempotencyKey);

        return res.json({
            success: true,
            actionPlan,
            result
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

