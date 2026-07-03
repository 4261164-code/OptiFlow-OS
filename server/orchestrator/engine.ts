import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";
import {
  OrchestrationJob,
  OrchestrationTask,
  STANDARD_PIPELINE,
  TriggerEvent,
  AgentType,
} from "./types";
import { publishToWordPress } from "../integrations/wordpress";
import { publishToPinterest } from "../integrations/pinterest";
import {
  runResearchAgent,
  runWriterAgent,
  runMonetizationAgent,
  runImageGenerationAgent,
} from "../agents";

export class OrchestrationEngine {
  static async startNewJob(
    userId: string,
    triggerEvent: TriggerEvent,
    targetId: string,
    initialContext: any = {},
  ) {
    logger.info(
      `[Orchestrator] Starting new job for user: ${userId}, Event: ${triggerEvent}, Target: ${targetId}`,
    );

    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const job: OrchestrationJob = {
      job_id: jobId,
      trigger_event: triggerEvent,
      target_id: targetId,
      status: "pending",
      current_agentIndex: 0,
      pipeline: STANDARD_PIPELINE,
      context: initialContext,
      created_at: Date.now(),
      updated_at: Date.now(),
      user_id: userId,
    };

    await db.collection("orchestration_jobs").doc(jobId).set(job);

    // Create the first task
    await this.queueTask({
      task_id: `task-${Date.now()}-${jobId}-0`,
      job_id: jobId,
      agent: STANDARD_PIPELINE[0],
      input: { targetId, context: initialContext },
      output: null,
      status: "pending",
      retry_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return jobId;
  }

  static async queueTask(task: OrchestrationTask) {
    await db.collection("orchestration_tasks").doc(task.task_id).set(task);
  }

  /**
   * Called by a background runner (cron)
   */
  static async processPendingTasks() {
    const snap = await db
      .collection("orchestration_tasks")
      .where("status", "==", "pending")
      .limit(10)
      .get();

    if (snap.empty) return;

    for (const doc of snap.docs) {
      const task = doc.data() as OrchestrationTask;

      // Check if it's scheduled for future
      if (task.run_after && Date.now() < task.run_after) continue;

      // Mark running
      await doc.ref.update({ status: "running", updated_at: Date.now() });

      logger.info(
        `[Orchestrator] Running task ${task.task_id} (${task.agent})...`,
      );

      try {
        const output = await this.executeAgent(
          task.agent,
          task.input,
          task.job_id,
        );

        // Mark completed
        await doc.ref.update({
          status: "completed",
          output,
          updated_at: Date.now(),
        });

        await this.advanceJob(task.job_id, output);
      } catch (err: any) {
        logger.error(
          `[Orchestrator] Task ${task.task_id} failed: ${err.message}`,
        );

        let newStatus = "failed";
        if (task.retry_count < 3) {
          newStatus = "retry";
          await doc.ref.update({
            status: newStatus,
            error: err.message,
            retry_count: task.retry_count + 1,
            run_after: Date.now() + 5000 * (task.retry_count + 1), // exponential backoff
            updated_at: Date.now(),
          });
        } else {
          // Dead letter queue
          await doc.ref.update({
            status: "failed",
            error: err.message,
            updated_at: Date.now(),
          });

          // Move to dead letter
          await db
            .collection("orchestration_dead_letter")
            .doc(task.task_id)
            .set({
              ...task,
              status: "failed",
              error: err.message,
              failed_at: Date.now(),
            });

          await db.collection("orchestration_jobs").doc(task.job_id).update({
            status: "failed",
            updated_at: Date.now(),
          });
        }
      }
    }
  }

  private static async advanceJob(jobId: string, lastOutput: any) {
    const jobDoc = await db.collection("orchestration_jobs").doc(jobId).get();
    if (!jobDoc.exists) return;

    const job = jobDoc.data() as OrchestrationJob;
    const nextIndex = job.current_agentIndex + 1;

    // Update context
    const updatedContext = { ...job.context, ...lastOutput };

    if (nextIndex >= job.pipeline.length) {
      // Pipeline finished
      await jobDoc.ref.update({
        status: "completed",
        context: updatedContext,
        updated_at: Date.now(),
      });
      logger.info(`[Orchestrator] Job ${jobId} FULLY COMPLETED.`);
      return;
    }

    const nextAgent = job.pipeline[nextIndex];

    await jobDoc.ref.update({
      current_agentIndex: nextIndex,
      context: updatedContext,
      updated_at: Date.now(),
    });

    // Queue next task
    await this.queueTask({
      task_id: `task-${Date.now()}-${jobId}-${nextIndex}`,
      job_id: jobId,
      agent: nextAgent,
      input: { targetId: job.target_id, context: updatedContext },
      output: null,
      status: "pending",
      retry_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }

  // Implementation of specific agent wrappers
  private static async executeAgent(
    agent: AgentType,
    input: any,
    jobId: string,
  ): Promise<any> {
    const { targetId, context } = input;
    // mock user
    const userId = "admin";

    switch (agent) {
      case "ResearchAgent":
        // For new_keyword, target is keyword
        const researchStr = await runResearchAgent(targetId, {
          userId,
          country: "US",
          language: "English",
        });
        return { research: researchStr };

      case "ContentAgent":
        const article = await runWriterAgent(
          targetId,
          context.research || "{}",
          { articleLength: 1000, tone: "Professional", hasFaq: true, userId },
        );
        return { article: article.content, title: article.title };

      case "SEOAgent":
        const optimized = await runMonetizationAgent(
          context.article || "",
          targetId,
          {
            seoLevel: "High",
            affiliateOffers: "",
            externalLinks: true,
            internalLinks: true,
            userId,
          },
        );
        return { optimized_article: optimized };

      case "MediaAgent":
        const imageUrl = await runImageGenerationAgent(targetId, userId);
        if (!imageUrl) throw new Error("Image generation failed");
        return {
          media: [{ url: imageUrl, alt: targetId }],
        };

      case "PublisherAgent":
        logger.info(`[PublisherAgent] Publishing ${targetId}`);
        if (!context.title || !context.optimized_article) {
          throw new Error("Missing title or article content for PublisherAgent");
        }
        const wpRes = await publishToWordPress({ title: context.title, article: context.optimized_article });
        if (!wpRes || !wpRes.link) throw new Error("Failed to get published URL from WordPress");
        return { publishedUrl: wpRes.link };

      case "DistributionAgent":
        logger.info(`[DistributionAgent] Distributing ${targetId}`);
        if (!context.publishedUrl) throw new Error("Missing publishedUrl for DistributionAgent");
        const pinRes = await publishToPinterest({ 
          title: context.title || targetId, 
          description: context.research || targetId, 
          url: context.publishedUrl, 
          image: context.media?.[0]?.url || "" 
        });
        if (!pinRes || !pinRes.id) throw new Error("Failed to get pin ID from Pinterest");
        return { distributionChannels: ["Pinterest"], pinId: pinRes.id };

      case "TrackingAgent":
        throw new Error("NotImplementedError");

      case "AnalyticsAgent":
        throw new Error("NotImplementedError");

      case "OptimizationAgent":
        throw new Error("NotImplementedError");

      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
  }
}
