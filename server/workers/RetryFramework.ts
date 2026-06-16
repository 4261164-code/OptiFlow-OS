import { db, hasServiceAccount } from "../firebaseAdmin";
import { logger } from "../lib/logger";

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export class RetryFramework {
  static async withRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    policy: RetryPolicy = { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2, maxBackoffMs: 30000 }
  ): Promise<T> {
    let attempt = 0;
    let currentBackoff = policy.backoffMs;

    while (attempt < policy.maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        logger.warn(`[RetryFramework] ${operationName} failed on attempt ${attempt}:`, error.message);

        if (attempt >= policy.maxRetries) {
          logger.error(`[RetryFramework] ${operationName} exhausted all ${policy.maxRetries} retries.`);
          await this.logDeadLetter(operationName, error, attempt);
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, currentBackoff));
        currentBackoff = Math.min(currentBackoff * policy.backoffMultiplier, policy.maxBackoffMs);
      }
    }
    throw new Error("Unreachable code in retry framework");
  }

  private static async logDeadLetter(operationName: string, error: any, attempts: number) {
    if (!hasServiceAccount) return;
    try {
      if (!db) return;
      await db.collection("system_dead_letters").add({
        operationName,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack || "",
        attempts,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      logger.error("[RetryFramework] Failed to write to DLQ.", e);
    }
  }
}
