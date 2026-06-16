import express from "express";
import { logger } from "../../lib/logger";
import { WorkerManager } from "../../workers/WorkerManager";
import { LockManager, LockDoc } from "../../lib/lockManager";
import { db } from "../../firebaseAdmin";

export const workersRouter = express.Router();

/**
 * Helper to run a worker with locking protection
 */
async function triggerWorkerEndpoint(workerName: string, res: express.Response) {
  const worker = WorkerManager.getWorker(workerName);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: `Worker "${workerName}" is not registered in WorkerManager.`
    });
  }

  logger.info(`[HTTP Worker Trigger] Received execution request for worker "${workerName}"`);

  // Attempt to execute task wrapped under the same distributed lock
  const lockKey = `worker-${workerName}`;
  const lockAcquired = await LockManager.acquireLock(lockKey);
  
  if (!lockAcquired) {
    logger.warn(`[HTTP Worker Trigger] Execution of "${workerName}" rejected; distributed lock is already held.`);
    return res.status(409).json({
      success: false,
      message: `Worker "${workerName}" execution skipped. A lock exists in Firestore or another container is currently run-processing.`,
      lockKey
    });
  }

  try {
    // Run the actual task
    await worker.task();
    
    return res.json({
      success: true,
      message: `Worker "${workerName}" processed and executed successfully.`
    });
  } catch (err: any) {
    logger.error(`[HTTP Worker Trigger] Worker "${workerName}" failed during trigger:`, err.message || err);
    return res.status(500).json({
      success: false,
      error: `Worker execution encountered an error: ${err.message || err}`
    });
  } finally {
    await LockManager.releaseLock(lockKey);
  }
}

/**
 * List all workers and their current distributed locks
 */
workersRouter.get("/status", async (req, res) => {
  try {
    const names = WorkerManager.getWorkerNames();
    const statusList = [];

    for (const name of names) {
      const worker = WorkerManager.getWorker(name);
      const lockKey = `worker-${name}`;
      const lockRef = db.collection("worker_locks").doc(lockKey);
      const lockSnap = await lockRef.get();
      
      let lockState: LockDoc | null = null;
      if (lockSnap.exists) {
        lockState = lockSnap.data() as LockDoc;
      }

      statusList.push({
        name,
        intervalMs: worker?.intervalMs,
        lockHeld: !!lockState?.locked,
        lockExpiresAt: lockState?.locked ? new Date(lockState.leaseExpires).toISOString() : null,
        ownerId: lockState?.ownerId || null
      });
    }

    res.json({
      success: true,
      workers: statusList
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint for clicks processing (User requested)
 * Postal / Job Scheduler endpoint
 */
workersRouter.post("/process-clicks", async (req, res) => {
  await triggerWorkerEndpoint("clickBuffer", res);
});

/**
 * Scheduled endpoints matching trigger configurations
 */
workersRouter.post("/conversion-reconciliation", async (req, res) => {
  await triggerWorkerEndpoint("conversionReconciliation", res);
});

workersRouter.post("/image-retry", async (req, res) => {
  await triggerWorkerEndpoint("imageRetry", res);
});

workersRouter.post("/metrics-aggregation", async (req, res) => {
  await triggerWorkerEndpoint("metricsAggregation", res);
});

workersRouter.post("/profit-calculation", async (req, res) => {
  await triggerWorkerEndpoint("profitCalculation", res);
});

workersRouter.post("/failure-intel", async (req, res) => {
  await triggerWorkerEndpoint("failureIntel", res);
});

workersRouter.post("/ceo-self-healing", async (req, res) => {
  await triggerWorkerEndpoint("ceoSelfHealing", res);
});

/**
 * Catch-all trigger by name
 */
workersRouter.post("/run/:workerName", async (req, res) => {
  const { workerName } = req.params;
  await triggerWorkerEndpoint(workerName, res);
});
