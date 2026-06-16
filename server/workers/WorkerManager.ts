import { logger } from "../lib/logger";
import { HealthManager } from "./HealthManager";
import { JobScheduler } from "./JobScheduler";
import { RetryFramework, RetryPolicy } from "./RetryFramework";
import { LockManager } from "../lib/lockManager";

export interface WorkerDefinition {
  name: string;
  intervalMs: number;
  task: () => Promise<void>;
  retryPolicy?: RetryPolicy;
  enabled?: boolean;
}

export class WorkerManager {
  private static workers = new Map<string, WorkerDefinition>();

  static registerWorker(worker: WorkerDefinition) {
    if (worker.enabled === false) {
      logger.info(`[WorkerManager] Worker ${worker.name} is disabled. Skipping registration.`);
      return;
    }

    this.workers.set(worker.name, worker);
    HealthManager.initializeWorker(worker.name);

    JobScheduler.schedule(worker.name, worker.intervalMs, async () => {
      if (!HealthManager.isHealthyEnoughToRun(worker.name)) {
        logger.warn(`[WorkerManager] Worker ${worker.name} skipped execution due to health degradation.`);
        return;
      }

      HealthManager.reportStart(worker.name);

      try {
        await LockManager.withLock(`worker-${worker.name}`, async () => {
          if (worker.retryPolicy) {
            await RetryFramework.withRetry(worker.name, worker.task, worker.retryPolicy);
          } else {
            await worker.task();
          }
        });
        HealthManager.reportSuccess(worker.name);
      } catch (error: any) {
        HealthManager.reportError(worker.name, error);
        logger.error(`[WorkerManager] Worker ${worker.name} failed:`, error.message);
      }
    });

    logger.info(`[WorkerManager] Registered worker ${worker.name}`);
  }

  static getWorker(name: string): WorkerDefinition | undefined {
    return this.workers.get(name);
  }

  static getWorkerNames(): string[] {
    return Array.from(this.workers.keys());
  }

  static async startAll() {
    logger.info("[WorkerManager] Starting all registered workers...");
    // Run all workers once on startup slightly staggered
    let delay = 0;
    for (const name of this.workers.keys()) {
      setTimeout(() => {
        JobScheduler.runNow(name).catch(e => logger.error(`[WorkerManager] Startup run failed for ${name}:`, e));
      }, delay);
      delay += 500; // stagger by 500ms
    }
  }

  static stopAll() {
    logger.info("[WorkerManager] Stopping all workers...");
    JobScheduler.stopAll();
  }
}
