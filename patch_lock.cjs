const fs = require('fs');
let code = fs.readFileSync('server/lib/lockManager.ts', 'utf8');

code = code.replace(
  `    if (!hasServiceAccount) {
      // In degraded mode, allow lock by default (single instance simulation)
      return true;
    }`,
  `    if (!hasServiceAccount) {
      // Degraded mode fails closed
      logger.warn('[LockManager] acquireLock failed: Running in degraded mode without service account. Refusing to run.');
      return false;
    }`
);

// Add renewLock function
const renewLockCode = `
  static async renewLock(lockName: string, additionalLeaseDurationMs: number = 5 * 60 * 1000): Promise<boolean> {
    if (!hasServiceAccount) return false;
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
      logger.error(\`[LockManager] Failed to renew lock for "\${lockName}":\`, err.message || err);
      return false;
    }
  }

  /**
`;

code = code.replace(`  /**\n   * Releases`, renewLockCode);

// Add heartbeating to withLock
code = code.replace(
  `  static async withLock<T>(
    lockName: string,
    task: () => Promise<T>,
    leaseDurationMs = 5 * 60 * 1000
  ): Promise<T | null> {
    const gotLock = await this.acquireLock(lockName, leaseDurationMs);
    if (!gotLock) {
      logger.info(\`[LockManager] Lock for "\${lockName}" skipped. Busy or held by another node.\`);
      return null;
    }
    try {
      return await task();
    } finally {
      await this.releaseLock(lockName);
    }
  }`,
  `  static async withLock<T>(
    lockName: string,
    task: () => Promise<T>,
    leaseDurationMs = 5 * 60 * 1000
  ): Promise<T | null> {
    const gotLock = await this.acquireLock(lockName, leaseDurationMs);
    if (!gotLock) {
      logger.info(\`[LockManager] Lock for "\${lockName}" skipped. Busy or held by another node.\`);
      return null;
    }

    // Start heartbeat
    const heartbeatInterval = setInterval(() => {
      this.renewLock(lockName, leaseDurationMs).catch(err => {
        logger.error(\`[LockManager] Heartbeat failure for "\${lockName}":\`, err);
      });
    }, Math.floor(leaseDurationMs / 2));

    try {
      return await task();
    } finally {
      clearInterval(heartbeatInterval);
      await this.releaseLock(lockName);
    }
  }`
);

fs.writeFileSync('server/lib/lockManager.ts', code);
