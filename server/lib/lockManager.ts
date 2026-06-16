import { db } from "../firebaseAdmin";
import { logger } from "./logger";

export interface LockDoc {
  locked: boolean;
  lockedAt: number;
  leaseExpires: number;
  ownerId?: string;
}

export class LockManager {
  private static instanceId = "instance-" + Math.random().toString(36).substring(2, 10);

  /**
   * Tries to acquire a distributed lock in Firestore using transactions.
   * A lease is issued for leaseDurationMs (defaults to 5 minutes).
   */
  static async acquireLock(lockName: string, leaseDurationMs = 5 * 60 * 1000): Promise<boolean> {
    try {
      const lockRef = db.collection("worker_locks").doc(lockName);

      const success = await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(lockRef);
        const now = Date.now();

        if (snap.exists) {
          const data = snap.data() as LockDoc;
          if (data && data.locked && data.leaseExpires > now) {
            // Lock is valid and owned by another active run
            return false;
          }
        }

        // Lock is either unowned or expired. Acquire it!
        tx.set(lockRef, {
          locked: true,
          lockedAt: now,
          leaseExpires: now + leaseDurationMs,
          ownerId: this.instanceId
        });
        return true;
      });

      return !!success;
    } catch (err: any) {
      logger.error(`[LockManager] Failed to acquire lock for "${lockName}":`, err.message || err);
      return false;
    }
  }

  /**
   * Releases an owned lock in Firestore.
   */
  static async releaseLock(lockName: string): Promise<void> {
    try {
      const lockRef = db.collection("worker_locks").doc(lockName);
      await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(lockRef);
        if (snap.exists) {
          const data = snap.data() as LockDoc;
          if (data && data.ownerId === this.instanceId) {
            tx.delete(lockRef);
          }
        }
      });
    } catch (err: any) {
      logger.error(`[LockManager] Failed to release lock for "${lockName}":`, err.message || err);
    }
  }

  /**
   * Runs a task wrapped within a distributed lock.
   */
  static async withLock<T>(
    lockName: string,
    task: () => Promise<T>,
    leaseDurationMs = 5 * 60 * 1000
  ): Promise<T | null> {
    const gotLock = await this.acquireLock(lockName, leaseDurationMs);
    if (!gotLock) {
      logger.info(`[LockManager] Lock for "${lockName}" skipped. Busy or held by another node.`);
      return null;
    }

    try {
      return await task();
    } finally {
      await this.releaseLock(lockName);
    }
  }
}
