import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";
import { JobObject } from "../schema";
import { processJob } from "./processors/processJob";

export class QueueWorker {
  static async processPendingJobs() {
    // 1. Fetch pending jobs
    const snap = await db.collection("jobs")
       .where("status", "==", "pending")
       .limit(5)
       .get();
       
    if (snap.empty) return;
    
    for (const doc of snap.docs) {
      // 2. Lock job safely with transaction
      let job: JobObject;
      try {
        job = await db.runTransaction(async (t) => {
          const docRef = db.collection("jobs").doc(doc.id);
          const tDoc = await t.get(docRef);
          if (tDoc.data()?.status !== "pending") {
            throw new Error("Job already processing");
          }
           
          t.update(docRef, { status: "running" });
          return tDoc.data() as JobObject;
        });
      } catch (err) {
        continue; // Locked by another worker
      }

      logger.info(`[QueueWorker] Locked and running job ${job.job_id} (${job.type})`);
      
      try {
         // 3. Run job handler
         const result = await this.handleJob(job);
         
         // 4. Update status & Analytics Feedback Loop
         await doc.ref.update({ status: "done" });
         
         // Record success in analytics / feedback loop
         await db.collection("job_analytics").add({
            job_id: job.job_id,
            type: job.type,
            outcome: "success",
            timestamp: Date.now()
         });

         logger.info(`[QueueWorker] Job ${job.job_id} completed successfully`);
      } catch (err: any) {
         // 5. Retry if failed
         const retryCount = job.retry_count || 0;
         if (retryCount < 3) {
            await doc.ref.update({ 
               status: "pending", 
               retry_count: retryCount + 1 
            });
            logger.warn(`[QueueWorker] Job ${job.job_id} failed, returning to pending queue. Retry ${retryCount + 1}`);
         } else {
            await doc.ref.update({ status: "failed" });
            logger.error(`[QueueWorker] Job ${job.job_id} failed permanently after 3 retries.`);
         }

         // Record failure in analytics / feedback loop
         await db.collection("job_analytics").add({
            job_id: job.job_id,
            type: job.type,
            outcome: "failed",
            error: err.message,
            timestamp: Date.now()
         });
      }
    }
  }

  private static async handleJob(job: JobObject) {
     return await processJob(job);
  }
}
