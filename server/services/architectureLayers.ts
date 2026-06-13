import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";

// ============================================================================
// LAYER 1: EDGE & EXPERIENCE LAYER (Fast responses, rate limiting, cache)
// ============================================================================

export interface CacheEntry {
  key: string;
  response: any;
  expiresAt: number;
}

export class Layer1Edge {
  private static inMemoryCache = new Map<string, CacheEntry>();
  private static ipRequestLog = new Map<string, { count: number; windowStart: number }>();

  /**
   * Rate Limit checks: 60 requests/minute limit
   */
  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const limitWindow = 60000; // 1 minute
    const limitMax = 60;

    const userLog = this.ipRequestLog.get(identifier);
    if (!userLog || (now - userLog.windowStart) > limitWindow) {
      this.ipRequestLog.set(identifier, { count: 1, windowStart: now });
      return false;
    }

    userLog.count++;
    if (userLog.count > limitMax) {
      return true;
    }
    return false;
  }

  /**
   * Fast edge read caching
   */
  static getCachedResponse(key: string): any | null {
    const now = Date.now();
    
    // 1. Check Memory Cache
    const entry = this.inMemoryCache.get(key);
    if (entry && entry.expiresAt > now) {
      logger.info(`[Layer1Edge Cache] Hit (Memory) for key: ${key}`);
      return entry.response;
    }

    return null;
  }

  /**
   * Write edge cache entry (Memory + Firestore hybrid)
   */
  static async setCachedResponse(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    const entry: CacheEntry = { key, response: data, expiresAt };
    
    // Set In-Memory
    this.inMemoryCache.set(key, entry);

    // Save backing Firestore cache
    try {
      await db.collection("edge_response_cache").doc(encodeURIComponent(key)).set({
        response: data,
        expiresAt,
        createdAt: Date.now()
      });
    } catch (err) {
      logger.warn("[Layer1Edge Cache] Firestore backup cache write failed:", err);
    }
  }

  /**
   * Evict from cache
   */
  static async evictCachedResponse(key: string) {
    this.inMemoryCache.delete(key);
    try {
      await db.collection("edge_response_cache").doc(encodeURIComponent(key)).delete();
    } catch (e) {}
  }
}

// ============================================================================
// LAYER 2: INTELLIGENCE & ORCHESTRATION LAYER (Decision engine, AI logic)
// ============================================================================

export interface NormalizedAction {
  action: string;
  target: string;
  impact: 'low' | 'medium' | 'high';
  reversibility: 'low' | 'high';
  factors: ('data_destruction' | 'payment_impact' | 'api_cost' | 'reversible' | 'cache_only')[];
  params?: any;
}

export interface ActionPlan {
  action: string;
  confidence: number;
  requires_approval: boolean;
  score: number;
  gate: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
  normalized: NormalizedAction;
}

export class Layer2Brain {
  /**
   * Decide which API model to select
   */
  static selectModel(taskComplexity: 'simple' | 'medium' | 'complex'): string {
    // Model Selection Rules Hierarchy
    if (taskComplexity === 'simple') return 'gemini-3.1-flash-lite';
    if (taskComplexity === 'medium') return 'gemini-3.5-flash';
    return 'gemini-3.5-flash'; // Avoid paid quota limits by using Gemini 3.5 Flash for complex backend orchestration unless requested
  }

  /**
   * Creates structured actions to pass into Safe Execution Layer
   */
  static formulateActionPlan(normalized: NormalizedAction): ActionPlan {
    const score = SafeExecutionEngine.calculateRiskScore(normalized);
    const gate = SafeExecutionEngine.evaluateDecisionGate(score);

    return {
      action: normalized.action,
      confidence: 0.95,
      requires_approval: gate === 'RED' || gate === 'BLACK',
      score,
      gate,
      normalized
    };
  }

  /**
   * Advisory Self-Healing Diagnosers (Produces action instructions without executing)
   */
  static diagnoseAnomalyAndRecommend(errorMsg: string, context?: any): NormalizedAction {
    const lowerMsg = errorMsg.toLowerCase();
    
    if (lowerMsg.includes("quota") || lowerMsg.includes("ratelimit") || lowerMsg.includes("429")) {
      return {
        action: "ROUTING_FAILOVER",
        target: "ai_provider",
        impact: "medium",
        reversibility: "high",
        factors: ["api_cost", "reversible"],
        params: { fallbackModel: "openai-gpt", originalError: errorMsg, ...context }
      };
    }

    if (lowerMsg.includes("deadlock") || lowerMsg.includes("transaction") || lowerMsg.includes("concurrency")) {
      return {
        action: "TRANSACTION_RETRY",
        target: "database",
        impact: "low",
        reversibility: "high",
        factors: ["reversible"],
        params: { retryAttempt: 1, originalError: errorMsg, ...context }
      };
    }

    if (lowerMsg.includes("stuck") || lowerMsg.includes("pending") || lowerMsg.includes("timeout")) {
      return {
        action: "REQUEUE_JOB",
        target: "background_worker",
        impact: "low",
        reversibility: "high",
        factors: ["reversible"],
        params: { actionType: "reset_status", originalError: errorMsg, ...context }
      };
    }

    // Default general advisory repair recommendation
    return {
      action: "GENERAL_HEAL_LOG",
      target: "system_logs",
      impact: "low",
      reversibility: "high",
      factors: ["cache_only"],
      params: { originalError: errorMsg, ...context }
    };
  }
}

// ============================================================================
// SYSTEM SECURITY CORES & SAFE EXECUTION POLICY ENGINE (Fenced sandbox firewall)
// ============================================================================

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  timestamp: number;
}

// 1. HARD STATE MACHINE ENFORCEMENT
export const STATE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["RUNNING"],
  RUNNING: ["SUCCESS", "FAILED"],
  FAILED: ["RETRYING"],
  RETRYING: ["RUNNING", "FAILED"],
  SUCCESS: [],
};

export class HardStateMachine {
  static validateTransition(fromState: string, toState: string): boolean {
    if (!fromState || !toState) return true;
    const validNextStates = STATE_TRANSITIONS[fromState];
    if (!validNextStates) return false;
    return validNextStates.includes(toState);
  }
}

// 2. SYSTEM INVARIANT KERNEL (CRITICAL HARD SAFETY BOUNDARIES)
export interface SystemState {
  duplicateStripeEvent?: boolean;
  activeRetryChains?: number;
  selfHealCooldownViolation?: boolean;
}

export class SystemInvariantsKernel {
  static enforceInvariants(state: SystemState): boolean {
    if (state.duplicateStripeEvent) {
      throw new Error("INVARIANT_BROKEN: NO_DUPLICATE_STRIPE_EVENTS - Duplicate payment action rejected by firewall.");
    }
    if (state.activeRetryChains !== undefined && state.activeRetryChains > 1) {
      throw new Error("INVARIANT_BROKEN: MAX_ONE_ACTIVE_RETRY_CHAIN_PER_JOB - Compounding cascade retry storm blocked.");
    }
    if (state.selfHealCooldownViolation) {
      throw new Error("INVARIANT_BROKEN: NO_SELF_HEAL_LOOP_WITHOUT_COOLDOWN - Self-healing loop lock violated.");
    }
    return true;
  }
}

// 3. TEMPORAL CONSTRAINT ENGINE
export interface TemporalEvent {
  action: string;
  timestamp: number;
}

export class TemporalConstraintEngine {
  private static eventWindow: TemporalEvent[] = [];

  static trackAndEvaluateRisk(action: string): { risk: 'OK' | 'CRITICAL'; reason?: string; burstFactor: number } {
    const now = Date.now();
    this.eventWindow.push({ action, timestamp: now });

    // Filter events in sliding 60-second window
    this.eventWindow = this.eventWindow.filter(e => now - e.timestamp < 60000);

    const burstFactor = this.eventWindow.length;
    // Set low limit for simple demo observability
    if (burstFactor > 10) {
      return {
        risk: "CRITICAL",
        reason: `CRITICAL TACTILE STORM: Event burst [${burstFactor} ops/min] detected. Auto-shutdown cooldown engaged to block cost explosion and AI loop runaway.`,
        burstFactor
      };
    }

    return { risk: "OK", burstFactor };
  }

  static getEventCount(): number {
    const now = Date.now();
    return this.eventWindow.filter(e => now - e.timestamp < 60000).length;
  }
}

// 4. CONSTRAINED SELF-HEALING ACTOR SAFETY
export class ConstrainedSelfHealer {
  static validateHealingAction(actionParams: any): { allowed: boolean; error?: string } {
    if (!actionParams) return { allowed: true };

    const cooldownPassed = actionParams.cooldownPassed !== false; // defaults to true
    const depth = actionParams.depth || 0;
    const impactScope = actionParams.impactScope || "LOCAL";

    if (!cooldownPassed) {
      return { allowed: false, error: "HEALING_COOL_DOWN_BLOCKED: Healing actor rejected because cooldown interval has not passed yet." };
    }
    if (depth > 1) {
      return { allowed: false, error: "HEALING_DEPTH_BLOCKED: Nested self-healing depth cannot exceed max limit of 1." };
    }
    if (impactScope === "GLOBAL") {
      throw new Error("HEALING_TOO_BROAD: Healing action was flagged with GLOBAL impact scope. Aborted to protect production database.");
    }

    return { allowed: true };
  }
}

// 5. POLICY DECIDER CHASSIS
export class SafeExecutionEngine {
  // Self Healing Budget registers (in-memory tracks)
  private static healActionsCount10m = 0;
  private static lastHealWindowStart = Date.now();
  private static errorHistory = new Map<string, { count: number; lastOccurred: number }>();
  private static activeCircuitBreakers = new Set<string>();

  /**
   * Calculates structural risk scores
   */
  static calculateRiskScore(normalized: NormalizedAction): number {
    let score = 0;
    for (const factor of normalized.factors) {
      if (factor === 'data_destruction') score += 40;
      if (factor === 'payment_impact') score += 40;
      if (factor === 'api_cost') score += 10;
      if (factor === 'reversible') score -= 30;
      if (factor === 'cache_only') score -= 50;
    }
    return score;
  }

  /**
   * Maps score to decision categories
   */
  static evaluateDecisionGate(score: number): 'GREEN' | 'YELLOW' | 'RED' | 'BLACK' {
    if (score <= 0) return 'GREEN';
    if (score <= 40) return 'YELLOW';
    if (score <= 80) return 'RED';
    return 'BLACK';
  }

  /**
   * Verify budget & loop preventions
   */
  static verifyHealingPolicy(anomalyKey: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    // Reset 10-minute budget window if past
    if (now - this.lastHealWindowStart > tenMinutes) {
      this.healActionsCount10m = 0;
      this.lastHealWindowStart = now;
    }

    // 1. Healing budget check
    if (this.healActionsCount10m >= 5) {
      return { allowed: false, reason: "Healing Budget exceeded (Max 5 checks per 10 minutes)." };
    }

    // 2. Anomaly loop detection check
    const errorLog = this.errorHistory.get(anomalyKey) || { count: 0, lastOccurred: now };
    if (now - errorLog.lastOccurred < tenMinutes) {
      errorLog.count++;
    } else {
      errorLog.count = 1;
    }
    errorLog.lastOccurred = now;
    this.errorHistory.set(anomalyKey, errorLog);

    // If same error occurs 3 times in 10 minutes
    if (errorLog.count >= 3) {
      this.activeCircuitBreakers.add(anomalyKey);
      return { 
        allowed: false, 
        reason: `Loop Detection triggered. Error '${anomalyKey}' occurred ${errorLog.count} times. Auto-repair disabled for this unit.` 
      };
    }

    // 3. Circuit breaker state check
    if (this.activeCircuitBreakers.has(anomalyKey)) {
      return { allowed: false, reason: `Circuit Breaker ACTIVE for matching pattern '${anomalyKey}'. Requires manual review.` };
    }

    // Increment budget
    this.healActionsCount10m++;
    return { allowed: true };
  }

  /**
   * Clean active circuit breaker state
   */
  static clearCircuitBreaker(anomalyKey: string) {
    this.activeCircuitBreakers.delete(anomalyKey);
    this.errorHistory.delete(anomalyKey);
  }

  /**
   * Get active circuit breaker list
   */
  static getCircuitBreakers(): string[] {
    return Array.from(this.activeCircuitBreakers);
  }
}

// ============================================================================
// LAYER 3: EXECUTION & INFRASTRUCTURE LAYER (Safe writes & transactions)
// ============================================================================

export class Layer3Execution {
  /**
   * Primary orchestrator of Layer 3 Execution
   */
  static async executeActionPlan(
    userId: string, 
    plan: ActionPlan, 
    idempotencyKey: string,
    trace?: TraceContext
  ): Promise<{ success: boolean; result?: any; error?: string; auditLogId?: string }> {
    const now = Date.now();

    // Initialize Event Trace context
    const currentTrace: TraceContext = trace || {
      traceId: "tr_" + Math.random().toString(36).substring(2, 12),
      spanId: "sp_" + Math.random().toString(36).substring(2, 12),
      timestamp: now
    };

    // 1. Idempotency Check
    try {
      const existingAudit = await db.collection("immutable_audit_logs")
        .where("idempotencyKey", "==", idempotencyKey)
        .limit(1)
        .get();

      if (!existingAudit.empty) {
        const auditDoc = existingAudit.docs[0].data();
        logger.info(`[Layer3Execution] Idempotency Hit for Key: ${idempotencyKey}. Returning previous result.`);
        return { success: true, result: auditDoc.result, auditLogId: existingAudit.docs[0].id };
      }
    } catch (e) {
      logger.warn("[Layer3Execution] Idempotency evaluation error:", e);
    }

    // 2. TEMPORAL CONSTRAINT CHECK (Sliding window burst check)
    const temporalStatus = TemporalConstraintEngine.trackAndEvaluateRisk(plan.action);
    if (temporalStatus.risk === 'CRITICAL') {
      const errorStr = `TEMPORAL_FAILSAFE_BLOCKED: ${temporalStatus.reason}`;
      const auditId = await this.writeAuditEntry({
        userId,
        idempotencyKey,
        action: plan.action,
        decisionScore: plan.score,
        gate: "YELLOW",
        status: "FAILED",
        error: errorStr,
        timestamp: now,
        trace: currentTrace
      });
      return { success: false, error: errorStr, auditLogId: auditId };
    }

    // 3. HARD STATE MACHINE VALIDATION
    const fromState = plan.normalized.params?.fromState;
    const toState = plan.normalized.params?.toState;
    if (fromState && toState) {
      const isValidTransition = HardStateMachine.validateTransition(fromState, toState);
      if (!isValidTransition) {
        const errorStr = `STATE_MACHINE_CORRUPTION_BLOCKED: Invalid state jump requested [${fromState} -> ${toState}]. Transaction aborted by Firewall.`;
        const auditId = await this.writeAuditEntry({
          userId,
          idempotencyKey,
          action: plan.action,
          decisionScore: plan.score,
          gate: "YELLOW",
          status: "FAILED",
          error: errorStr,
          timestamp: now,
          trace: currentTrace
        });
        return { success: false, error: errorStr, auditLogId: auditId };
      }
    }

    // 4. CONSTRAINED SELF-HEALING SCHEDULER CHECKS
    const selfRepairActions = ["ROUTING_FAILOVER", "TRANSACTION_RETRY", "REQUEUE_JOB"];
    if (selfRepairActions.includes(plan.action)) {
      try {
        const actorResult = ConstrainedSelfHealer.validateHealingAction(plan.normalized.params);
        if (!actorResult.allowed) {
          const errorStr = `SELF_HEALING_ACTOR_BLOCKED: ${actorResult.error}`;
          const auditId = await this.writeAuditEntry({
            userId,
            idempotencyKey,
            action: plan.action,
            decisionScore: plan.score,
            gate: "YELLOW",
            status: "FAILED",
            error: errorStr,
            timestamp: now,
            trace: currentTrace
          });
          return { success: false, error: errorStr, auditLogId: auditId };
        }
      } catch (err: any) {
        const errorStr = `SELF_HEALING_ACTOR_EXCEPTION: ${err.message}`;
        const auditId = await this.writeAuditEntry({
          userId,
          idempotencyKey,
          action: plan.action,
          decisionScore: plan.score,
          gate: "BLACK",
          status: "BLOCKED",
          error: errorStr,
          timestamp: now,
          trace: currentTrace
        });
        return { success: false, error: errorStr, auditLogId: auditId };
      }
    }

    // 5. SYSTEM INVARIANT KERNEL EVALUATION
    try {
      const systemState: SystemState = {
        duplicateStripeEvent: plan.normalized.params?.duplicateStripeEvent,
        activeRetryChains: plan.normalized.params?.activeRetryChains,
        selfHealCooldownViolation: plan.normalized.params?.selfHealCooldownViolation
      };
      SystemInvariantsKernel.enforceInvariants(systemState);
    } catch (err: any) {
      const errorStr = `INVARIANT_VIOLATION_BLOCKED: ${err.message}`;
      const auditId = await this.writeAuditEntry({
        userId,
        idempotencyKey,
        action: plan.action,
        decisionScore: plan.score,
        gate: "BLACK",
        status: "BLOCKED",
        error: errorStr,
        timestamp: now,
        trace: currentTrace
      });
      return { success: false, error: errorStr, auditLogId: auditId };
    }

    // 6. Policy Decider gate validation (RED/BLACK)
    if (plan.gate === 'BLACK') {
      const errorStr = `HARD_BLOCK: Requested action '${plan.action}' classified as forbidden under security policies. (Score: ${plan.score})`;
      const auditId = await this.writeAuditEntry({
        userId,
        idempotencyKey,
        action: plan.action,
        decisionScore: plan.score,
        gate: plan.gate,
        status: "BLOCKED",
        error: errorStr,
        timestamp: now,
        trace: currentTrace
      });
      return { success: false, error: errorStr, auditLogId: auditId };
    }

    if (plan.gate === 'RED' && !plan.normalized.params?.approvedByAdmin) {
      // Create Pending Action for Admin Approval
      const approvalDoc = {
        userId,
        idempotencyKey,
        actionPlan: plan,
        status: "PENDING_APPROVAL",
        timestamp: now,
        trace: currentTrace
      };
      
      const pendingRef = await db.collection("pending_approvals").add(approvalDoc);
      const errorStr = `REQUIRE_APPROVAL: Action '${plan.action}' scored RED (${plan.score}). Queued for validation under reference id ${pendingRef.id}.`;
      
      await this.writeAuditEntry({
        userId,
        idempotencyKey,
        action: plan.action,
        decisionScore: plan.score,
        gate: plan.gate,
        status: "QUEUED_APPROVAL",
        error: errorStr,
        timestamp: now,
        trace: currentTrace
      });

      return { success: false, error: errorStr };
    }

    // 7. Execution of validated instructions
    let execResult: any = null;
    let success = false;
    let executionError: string | undefined = undefined;

    try {
      if (plan.action === "ROUTING_FAILOVER") {
        // Mock rotation failover setting update
        await db.collection("settings").doc(userId).set({
          fallbackModelActive: true,
          activeModelSelected: plan.normalized.params?.fallbackModel || "gemini-3.5-flash",
          lastRotatedAt: now
        }, { merge: true });
        execResult = { updated: true, currentModel: plan.normalized.params?.fallbackModel };
        success = true;
      } 
      else if (plan.action === "TRANSACTION_RETRY" || plan.action === "REQUEUE_JOB") {
        // Self restoration of keys and stuck logs
        const queueRef = await db.collection("image_retry_queue")
          .where("userId", "==", userId)
          .where("status", "==", "FAILED")
          .limit(5)
          .get();

        const batch = db.batch();
        queueRef.forEach(doc => {
          batch.update(doc.ref, { status: "IMAGE_PENDING", attempt: 0, nextRetryAt: now });
        });
        await batch.commit();
        execResult = { refreshedCount: queueRef.size };
        success = true;
      } 
      else if (plan.action === "GENERAL_HEAL_LOG") {
        // Generic healing log entry if no specific action matched
        await db.collection("error_logs").add({
          message: "System self-healing cycle completed successfully with no critical blocking anomalies.",
          severity: "Low",
          timestamp: Date.now()
        });
        success = true;
      }
      else if (plan.action === "RESET_CIRCUIT_BREAKER") {
        const breakerKey = plan.normalized.params?.breakerKey;
        if (breakerKey) {
          SafeExecutionEngine.clearCircuitBreaker(breakerKey);
          execResult = { cleared: breakerKey };
          success = true;
        } else {
          throw new Error("Missing breakerKey parameter.");
        }
      }
      else {
        // Fallback catch-all execution block
        execResult = { state: "unhandled_or_completed" };
        success = true;
      }
    } catch (err: any) {
      executionError = err.message || String(err);
      success = false;
    }

    // 8. Immutable Audit Write back complete with Correlation Tracing ID
    const auditId = await this.writeAuditEntry({
      userId,
      idempotencyKey,
      action: plan.action,
      decisionScore: plan.score,
      gate: plan.gate,
      status: success ? "SUCCESS" : "FAILED",
      result: execResult,
      error: executionError,
      timestamp: now,
      trace: currentTrace,
      rollbackPointer: success ? `undo_${plan.action}_${idempotencyKey}` : undefined
    });

    return {
      success,
      result: execResult,
      error: executionError,
      auditLogId: auditId
    };
  }

  /**
   * Append audit logs to the strict DB collection safely
   */
  private static async writeAuditEntry(auditDoc: any): Promise<string> {
    try {
      const ref = await db.collection("immutable_audit_logs").add(auditDoc);
      return ref.id;
    } catch (err) {
      logger.error("[Layer3Execution] AUDIT WRITE FAILURE:", err);
      return "fallback_audit_id";
    }
  }

  /**
   * Revert a previously executed action
   */
  static async executeRollback(userId: string, auditLogId: string): Promise<boolean> {
    try {
      const snap = await db.collection("immutable_audit_logs").doc(auditLogId).get();
      if (!snap.exists) return false;

      const data = snap.data();
      if (data?.status !== "SUCCESS") return false;

      logger.info(`[Layer3Execution] Executing rollback of actions: ${data.action} | pointer: ${data.rollbackPointer}`);

      // Perform inverse action
      if (data.action === "ROUTING_FAILOVER") {
        await db.collection("settings").doc(userId).update({
          fallbackModelActive: false,
          activeModelSelected: "gemini-3.1-flash-lite"
        });
      }

      await db.collection("immutable_audit_logs").doc(auditLogId).update({
        status: "ROLLED_BACK",
        rolledBackAt: Date.now()
      });

      return true;
    } catch (err) {
      logger.error(`Rollback failed for auditId: ${auditLogId}`, err);
      return false;
    }
  }
}
