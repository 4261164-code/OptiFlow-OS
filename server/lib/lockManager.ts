import { db, hasServiceAccount } from "../firebaseAdmin";
import { logger } from "./logger";

export interface LockDoc {
  locked: boolean;
  lockedAt: number;
  leaseExpires: number;
  ownerId?: string;
}

export class LockManager {
  private static instanceId = "instance-" + Math.random().toString(36).substring(2, 10);
  private static useMemoryLocks = false;
  private static memoryLocks = new Map<string, LockDoc>();

  static setUseMemoryLocks(value: boolean) {
    if (this.useMemoryLocks !== value) {
      this.useMemoryLocks = value;
      if (value) {
        logger.info("[LockManager] Switched to high-reliability In-Memory Lock engine.");
      }
    }
  }

  static isMemoryMode(): boolean {
    return this.useMemoryLocks || !hasServiceAccount;
  }

  private static acquireMemoryLock(lockName: string, leaseDurationMs: number): boolean {
    const now = Date.now();
    const existing = this.memoryLocks.get(lockName);
    if (existing && existing.locked && existing.leaseExpires > now) {
      return false;
    }
    this.memoryLocks.set(lockName, {
      locked: true,
      lockedAt: now,
      leaseExpires: now + leaseDurationMs,
      ownerId: this.instanceId
    });
    return true;
  }

  private static renewMemoryLock(lockName: string, additionalLeaseDurationMs: number): boolean {
    const now = Date.now();
    const existing = this.memoryLocks.get(lockName);
    if (existing && existing.locked && existing.ownerId === this.instanceId) {
      existing.leaseExpires = now + additionalLeaseDurationMs;
      return true;
    }
    return false;
  }

  private static releaseMemoryLock(lockName: string): void {
    const existing = this.memoryLocks.get(lockName);
    if (existing && existing.ownerId === this.instanceId) {
      this.memoryLocks.delete(lockName);
    }
  }

  /**
   * Tries to acquire a distributed lock in Firestore using transactions.
   * A lease is issued for leaseDurationMs (defaults to 5 minutes).
   */
  static async acquireLock(lockName: string, leaseDurationMs = 5 * 60 * 1000): Promise<boolean> {
    if (this.isMemoryMode()) {
      return this.acquireMemoryLock(lockName, leaseDurationMs);
    }
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
      const errStr = String(err?.message || err || "").toUpperCase();
      const isPermissionError = 
        errStr.includes("PERMISSION_DENIED") || 
        errStr.includes("PERMISSION_DENIED:") ||
        errStr.includes("PERMISSION") || 
        errStr.includes("DENIED") || 
        err?.code === 7 || 
        err?.code === "permission-denied" ||
        err?.status === 7;

      if (isPermissionError) {
        logger.warn(`[LockManager] Firestore lock acquisition failed with permission error. Gracefully falling back to In-Memory Lock engine for "${lockName}".`);
        this.setUseMemoryLocks(true);
        return this.acquireMemoryLock(lockName, leaseDurationMs);
      }
      logger.error(`[LockManager] Failed to acquire lock for "${lockName}":`, err.message || err);
      return false;
    }
  }

  static async renewLock(lockName: string, additionalLeaseDurationMs: number = 5 * 60 * 1000): Promise<boolean> {
    if (this.isMemoryMode()) {
      return this.renewMemoryLock(lockName, additionalLeaseDurationMs);
    }
    try {
      const lockRef = db.collection("worker_locks").doc(lockName);
      const success = await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(lockRef);
        const now = Date.now();
        if (snap.exists) {
          const data = snap.data() as LockDoc;
          if (data && data.locked && data.ownerId === this.instanceId) {
            tx.update(lockRef, {
              leaseExpires: now + additionalLeaseDurationMs
            });
            return true;
          }
        }
        return false;
      });
      return !!success;
    } catch (err: any) {
      const errStr = String(err?.message || err || "").toUpperCase();
      const isPermissionError = 
        errStr.includes("PERMISSION_DENIED") || 
        errStr.includes("PERMISSION_DENIED:") ||
        errStr.includes("PERMISSION") || 
        errStr.includes("DENIED") || 
        err?.code === 7 || 
        err?.code === "permission-denied" ||
        err?.status === 7;

      if (isPermissionError) {
        this.setUseMemoryLocks(true);
        return this.renewMemoryLock(lockName, additionalLeaseDurationMs);
      }
      logger.error(`[LockManager] Failed to renew lock for "${lockName}":`, err.message || err);
      return false;
    }
  }

  /**
   * Releases an owned lock in Firestore.
   */
  static async releaseLock(lockName: string): Promise<void> {
    if (this.isMemoryMode()) {
      this.releaseMemoryLock(lockName);
      return;
    }
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
      const errStr = String(err?.message || err || "").toUpperCase();
      const isPermissionError = 
        errStr.includes("PERMISSION_DENIED") || 
        errStr.includes("PERMISSION_DENIED:") ||
        errStr.includes("PERMISSION") || 
        errStr.includes("DENIED") || 
        err?.code === 7 || 
        err?.code === "permission-denied" ||
        err?.status === 7;

      if (isPermissionError) {
        this.setUseMemoryLocks(true);
        this.releaseMemoryLock(lockName);
        return;
      }
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

