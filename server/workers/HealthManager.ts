import { db, hasServiceAccount } from "../firebaseAdmin";
import { logger } from "../lib/logger";

export interface WorkerHealthStatus {
  name: string;
  status: "healthy" | "degraded" | "failed";
  lastRunTime: number;
  lastSuccessTime: number;
  lastErrorTime: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  successCount: number;
  runCount: number;
}

export class HealthManager {
  private static workersHealth = new Map<string, WorkerHealthStatus>();

  static initializeWorker(name: string) {
    if (!this.workersHealth.has(name)) {
      this.workersHealth.set(name, {
        name,
        status: "healthy",
        lastRunTime: 0,
        lastSuccessTime: 0,
        lastErrorTime: null,
        lastError: null,
        consecutiveFailures: 0,
        successCount: 0,
        runCount: 0,
      });
    }
  }

  static reportStart(name: string) {
    this.initializeWorker(name);
    const health = this.workersHealth.get(name)!;
    health.lastRunTime = Date.now();
    health.runCount++;
  }

  static reportSuccess(name: string) {
    const health = this.workersHealth.get(name);
    if (!health) return;
    health.status = "healthy";
    health.lastSuccessTime = Date.now();
    health.consecutiveFailures = 0;
    health.successCount++;
  }

  static reportError(name: string, error: any) {
    const health = this.workersHealth.get(name);
    if (!health) return;
    health.lastErrorTime = Date.now();
    health.lastError = error?.message || String(error);
    health.consecutiveFailures++;
    health.status = health.consecutiveFailures >= 3 ? "failed" : "degraded";
    
    // Log to DB if critical
    if (health.status === "failed") {
      this.logCriticalFailure(name, health);
    }
  }

  static getHealth(name: string): WorkerHealthStatus | undefined {
    return this.workersHealth.get(name);
  }

  static getAllHealthStatuses(): Record<string, WorkerHealthStatus> {
    return Object.fromEntries(this.workersHealth);
  }

  static isHealthyEnoughToRun(name: string): boolean {
    const health = this.workersHealth.get(name);
    // If it has failed, allow retry every 5 failures approx, or just 10 mins.
    if (!health) return true;
    if (health.status === "failed") {
      const timeSinceLastError = Date.now() - (health.lastErrorTime || 0);
      if (timeSinceLastError < 10 * 60 * 1000) {
        return false; // Skip execution if hard-failed in last 10 mins
      }
    }
    return true;
  }

  private static async logCriticalFailure(name: string, health: WorkerHealthStatus) {
    if (!hasServiceAccount) return;
    try {
      if (!db) return;
      await db.collection("system_health_alerts").doc(`worker_${name}`).set({
        workerName: name,
        status: health.status,
        lastError: health.lastError,
        consecutiveFailures: health.consecutiveFailures,
        lastErrorTime: new Date(health.lastErrorTime || Date.now()).toISOString(),
      }, { merge: true });
    } catch (e) {
      logger.error(`[HealthManager] Failed to log health alert for ${name}`, e);
    }
  }
}
