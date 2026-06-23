import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";
import { runPipeline } from "../pipeline";
import { LockManager } from "../lib/lockManager";

/**
 * Pipeline Worker processing stuck and pending jobs.
 * Runs in the background to ensure jobs don't get stuck in RUNNING forever.
 */
export async function runPipelineQueueWorker() {
  const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes

  try {
    // Look for pending jobs or stuck running jobs
    const snap = await db.collection("jobs")
      .where("status", "in", ["pending", "running"])
      .limit(10)
      .get();

    for (const doc of snap.docs) {
      const job = doc.data();
      const jobId = doc.id;
      
      if (job.status === "running" && job.updatedAt >= cutoff && !job.forceRetry) {
        // Still actively running and was updated recently.
        continue;
      }

      await LockManager.withLock(`pipeline-job-${jobId}`, async () => {
         const retries = job.retries || 0;
         const MAX_RETRIES = 3;

         if (retries >= MAX_RETRIES) {
             logger.warn(`[PipelineWorker] Job ${jobId} exceeded max retries. Moving to DLQ.`);
             await db.collection("jobs").doc(jobId).update({
                 status: "failed",
                 dlq: true,
                 updatedAt: Date.now()
             });
             return;
         }

         logger.info(`[PipelineWorker] Resuming/Executing Job ${jobId} (Retry ${retries})`);
         await db.collection("jobs").doc(jobId).update({
             status: "running",
             retries: retries + 1,
             updatedAt: Date.now(),
             forceRetry: false
         });
         
         const logRef = db.collection("automationLogs").doc(job.logId || `auto-run-${jobId}`);
         const logSnap = await logRef.get();
         let logs = logSnap.exists ? logSnap.data()?.logs || [] : [];
         
         if (!logSnap.exists) {
            await logRef.set({ id: logRef.id, jobId, status: "running", logs: [], createdAt: Date.now(), updatedAt: Date.now() });
         }

         try {
            await runPipeline({
                userId: job.userId,
                jobId,
                keyword: job.keyword,
                seoLevel: job.seoLevel || "High",
                numPins: job.numPins || 3,
                affiliateOffers: job.affiliateOffers,
                // Resume states:
                existingArticleTitle: job.articleTitle,
                existingArticleContent: job.articleContent
            });
            
            await db.collection("jobs").doc(jobId).update({
                status: "completed",
                updatedAt: Date.now()
            });
         } catch (error: any) {
            logger.error(`[PipelineWorker] Job ${jobId} execution failed: ${error.message}`);
            await db.collection("jobs").doc(jobId).update({
                status: "pending", // Reset to pending for retry queue
                lastError: error.message,
                updatedAt: Date.now()
            });
         }
      });
    }
  } catch (error) {
     logger.error("[PipelineWorker] Queue processing error:", error);
  }
}
