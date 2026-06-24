import { logger } from "../../lib/logger";
import express from "express";
import { db, hasServiceAccount } from "../../firebaseAdmin";
import { runPipeline } from "../../pipeline";
import { 
    runClickBufferWorker, 
    runConversionReconciliationWorker, 
    runMetricsAggregationWorker, 
    runCostProfitWorker, 
    runFailureIntelligenceWorker 
} from "../../services/backgroundWorker";

export const opsRouter = express.Router();

/**
 * Endpoint to Pause or Resume Topic Clusters
 */
opsRouter.post("/cluster/pause-resume", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const { clusterId, action } = req.body; // action: "pause" or "resume"
        if (!clusterId || !action) {
            return res.status(400).json({ error: "Missing clusterId or action parameter" });
        }

        const nextStatus = action === "pause" ? "paused" : "planning";
        if (!hasServiceAccount) {
            return res.json({
                success: true,
                clusterId,
                status: nextStatus,
                message: `Topic cluster (mock) has been ${action === "pause" ? "paused" : "resumed"} successfully.`
            });
        }

        const clusterRef = db.collection("topic_clusters").doc(clusterId);
        const snap = await clusterRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: `Topic cluster ${clusterId} not found.` });
        }

        // Verify ownership
        if (snap.data().userId !== userId) {
            return res.status(403).json({ error: "Forbidden: You do not own this cluster" });
        }

        await clusterRef.update({
            status: nextStatus,
            updatedAt: Date.now()
        });

        logger.info(`[SaaS Ops] Cluster ${clusterId} status updated to: ${nextStatus}`);

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
opsRouter.post("/job/retry", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const { jobId } = req.body;
        if (!jobId) {
            return res.status(400).json({ error: "jobId parameter is required" });
        }

        if (!hasServiceAccount) {
            return res.json({
                success: true,
                jobId,
                message: "Job reset simulated successfully (No Firestore service account configured)."
            });
        }

        const jobRef = db.collection("jobs").doc(jobId);
        const snap = await jobRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: `Job ${jobId} not found.` });
        }

        const jobData = snap.data() || {};
        if (jobData.userId !== userId) {
             return res.status(403).json({ error: "Forbidden: You do not own this job" });
        }

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
                logger.info(`[SaaS Ops] Retrying failed pipeline job: ${jobId} (Keyword: ${jobData.keyword})`);
                await runPipeline({
                    userId: userId,
                    jobId: jobId,
                    keyword: jobData.keyword,
                    forceRebuild: true
                } as any);
            } catch (retryErr: any) {
                logger.error(`[SaaS Ops] Async retry of Job ${jobId} failed:`, retryErr);
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
opsRouter.post("/recovery/ledger-sync", async (req: any, res: any) => {
    try {
        logger.info("[SaaS Ops] Manual ledger synchronization and metric compile triggered.");

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
opsRouter.get("/health-digest", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            return res.json({
                success: true,
                overview: {
                    agentFailureRate: 0.05,
                    pipelineFailureRate: 0.02,
                    retrySuccessRate: 1.0,
                    mostUnstableClusters: ["Autonomous Marketing"],
                    mostFailingOffers: ["None"],
                    timestamp: Date.now()
                },
                recentCosts: [],
                topProfitMetrics: []
            });
        }
        const userId = req.user.uid;
        const [summarySnap, costsSnap, profitsSnap] = await Promise.all([
          db.collection("system_health_metrics").doc("summary").get(),
          db.collection("cost_events").where("userId", "==", userId).orderBy("timestamp", "desc").limit(30).get(),
          db.collection("profit_metrics").where("userId", "==", userId).orderBy("profit", "desc").limit(10).get()
        ]);
        
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

        const costs = costsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
opsRouter.get("/api-health", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            const { ApiHealthMonitor } = await import("../../services/healthMonitor");
            const freshHealth = await ApiHealthMonitor.runDiagnostics();
            return res.json({ success: true, apiHealth: freshHealth });
        }
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
opsRouter.post("/api-health/trigger", async (req: any, res: any) => {
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
opsRouter.get("/system-diagnostics", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            return res.json({ success: true, metrics: [] });
        }
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
opsRouter.get("/error-logs", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            return res.json({ success: true, logs: [] });
        }
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
opsRouter.get("/audit-logs", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            return res.json({ success: true, logs: [] });
        }
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
opsRouter.get("/pending-approvals", async (req: any, res: any) => {
    try {
        if (!hasServiceAccount) {
            return res.json({ success: true, approvals: [] });
        }
        let approvals: any[] = [];
        try {
            const snap = await db.collection("pending_approvals")
                .where("status", "==", "PENDING_APPROVAL")
                .orderBy("timestamp", "desc")
                .limit(50)
                .get();
            approvals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err: any) {
            if (err.message?.includes("index") || err.code === 9) {
                logger.warn("[Ops API] /pending-approvals missing composite index. Fetching & sorting in-memory.");
                const snap = await db.collection("pending_approvals")
                    .where("status", "==", "PENDING_APPROVAL")
                    .limit(100)
                    .get();
                approvals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                approvals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                approvals = approvals.slice(0, 50);
            } else {
                throw err;
            }
        }
        return res.json({ success: true, approvals });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Approve or Decline a pending Layer 3 action
 */
opsRouter.post("/approvals/evaluate", async (req: any, res: any) => {
    try {
        const { id, decision } = req.body; // decision: 'APPROVE' | 'DECLINE'
        const userId = req.user.uid;

        if (!hasServiceAccount) {
            return res.json({ success: true, status: decision === 'DECLINE' ? "DECLINED" : "APPROVED", result: { success: true, mock: true } });
        }

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
opsRouter.post("/audit-logs/rollback", async (req: any, res: any) => {
    try {
        const { auditLogId } = req.body;
        const userId = req.user.uid;

        if (!hasServiceAccount) {
            return res.json({ success: true, message: "Action successfully rolled back (mock)." });
        }

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
opsRouter.get("/active-breakers", async (req: any, res: any) => {
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
opsRouter.post("/active-breakers/reset", async (req: any, res: any) => {
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
opsRouter.post("/simulate-anomaly", async (req: any, res: any) => {
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
        const userId = req.user.uid;

        const { Layer2Brain, SafeExecutionEngine, Layer3Execution } = await import("../../services/architectureLayers");

        // Simple anomaly identifier
        const issueKey = errorMsg.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 40);

        // Check self healing budget & loop lock
        const policyCheck = SafeExecutionEngine.verifyHealingPolicy(issueKey);
        if (!policyCheck.allowed) {
            // Write to error log directly
            if (hasServiceAccount) {
                await db.collection("error_logs").add({
                    message: `[Self Healing Budget Alert] Auto-repair blocked: ${policyCheck.reason}`,
                    category: "worker",
                    severity: "Critical",
                    recommendation: "Review active breakers and increase budget boundaries as needed.",
                    timestamp: Date.now()
                });
            }
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

/**
 * Endpoint to Purge All Mock & Test Data for the active User
 */
opsRouter.post("/purge-all-data", async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        if (!hasServiceAccount) {
            return res.json({
                success: true,
                message: "Purge complete (Simulated environment - local storage/memory reset)."
            });
        }

        const targetCollections = [
            "jobs",
            "articles",
            "pins",
            "image_retry_queue",
            "offers",
            "notifications",
            "topic_clusters",
            "cluster_nodes",
            "revenue_metrics",
            "agent_logs",
            "agent_nodes",
            "strategic_memory",
            "ceo_targets",
            "daily_metrics",
            "revenue_events",
            "affiliate_clicks",
            "affiliate_conversions",
            "change_proposals",
            "clicks",
            "conversions",
            "system_events",
            "system_faults",
            "agent_messages",
            "orchestration_jobs",
            "orchestration_tasks",
            "click_errors",
            "webops_seo_logs"
        ];

        let totalDeleted = 0;
        const purgeDetails: Record<string, number> = {};

        for (const colName of targetCollections) {
            // Query by userId
            const q1 = db.collection(colName).where("userId", "==", userId).get();
            const q2 = db.collection(colName).where("user_id", "==", userId).get();
            
            const [snap1, snap2] = await Promise.all([q1, q2]);
            
            const docIdsToDelete = new Set<string>();
            snap1.forEach(doc => docIdsToDelete.add(doc.id));
            snap2.forEach(doc => docIdsToDelete.add(doc.id));

            // Also scan for documents that have mock prefix or mock fields
            try {
                const snapAll = await db.collection(colName).get();
                snapAll.forEach(doc => {
                    const data = doc.data();
                    if (
                        doc.id.startsWith("mock_") || 
                        doc.id.startsWith("sim_") || 
                        data.isMock === true || 
                        data.mock === true ||
                        data.userId === "mock-user-id" ||
                        data.user_id === "mock-user-id"
                    ) {
                        docIdsToDelete.add(doc.id);
                    }
                });
            } catch (scanErr) {
                // Ignore collection scan errors if collection doesn't exist yet or is empty
            }

            if (docIdsToDelete.size > 0) {
                const batch = db.batch();
                let count = 0;
                docIdsToDelete.forEach(id => {
                    batch.delete(db.collection(colName).doc(id));
                    count++;
                });
                await batch.commit();
                totalDeleted += count;
                purgeDetails[colName] = count;
            } else {
                purgeDetails[colName] = 0;
            }
        }

        logger.info(`[SaaS Ops] User ${userId} requested full mock data purge. Total records deleted: ${totalDeleted}`);

        return res.json({
            success: true,
            message: `Successfully purged all mock and test data! Total records deleted: ${totalDeleted}`,
            details: purgeDetails
        });
    } catch (err: any) {
        logger.error(`[SaaS Ops] Purge failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});


