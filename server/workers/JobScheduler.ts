import { logger } from "../lib/logger";

export interface Job {
  name: string;
  intervalMs: number;
  task: () => Promise<void>;
  timer?: NodeJS.Timeout;
}

export class JobScheduler {
  private static jobs = new Map<string, Job>();
  private static runningLocks = new Set<string>();

  static schedule(name: string, intervalMs: number, task: () => Promise<void>) {
    if (this.jobs.has(name)) {
      logger.warn(`[JobScheduler] Job ${name} is already scheduled.`);
      return;
    }

    const timer = setInterval(async () => {
      await this.runNow(name);
    }, intervalMs);

    this.jobs.set(name, {
      name,
      intervalMs,
      task,
      timer
    });
    
    logger.info(`[JobScheduler] Scheduled job ${name} to run every ${intervalMs}ms`);
  }

  static async runNow(name: string) {
    const job = this.jobs.get(name);
    if (!job) {
      logger.error(`[JobScheduler] Job ${name} not found.`);
      return;
    }

    if (this.runningLocks.has(name)) {
      logger.warn(`[JobScheduler] Job ${name} skipped. Previous execution still running.`);
      return;
    }

    this.runningLocks.add(name);
    try {
      await job.task();
    } catch (e) {
      logger.error(`[JobScheduler] Job ${name} failed during execution:`, e);
    } finally {
      this.runningLocks.delete(name);
    }
  }

  static stop(name: string) {
    const job = this.jobs.get(name);
    if (job?.timer) {
      clearInterval(job.timer);
    }
    this.jobs.delete(name);
    logger.info(`[JobScheduler] Stopped job ${name}`);
  }

  static stopAll() {
    for (const [name, job] of this.jobs) {
      if (job.timer) clearInterval(job.timer);
      logger.info(`[JobScheduler] Stopped job ${name}`);
    }
    this.jobs.clear();
    this.runningLocks.clear();
  }
}
