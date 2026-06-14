import { Router } from "express";
import { runCompetitorAuditAgent, runStrategyAdoptionAgent } from "../../agents";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";
import { logger } from "../../lib/logger";

const router = Router();

router.post("/audit", async (req: any, res) => {
  const userId = req.user.uid;
  const { keyword, domain } = req.body;

  if (!keyword || !domain) {
    return res.status(400).json({ error: "Missing keyword or domain" });
  }

  const idempotencyKey = `audit-${userId}-${keyword}-${domain}-${Date.now()}`;
  
  // Apply Layer 2 Decision
  const plan = Layer2Brain.formulateActionPlan({
    action: "STRATEGY_AUDIT",
    target: "competitor_data",
    impact: "low",
    reversibility: "high",
    factors: ["api_cost", "reversible"],
    params: { keyword, domain }
  });

  // Layer 3 Execution
  const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
  
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  try {
    console.log(`[Strategy] Auditing competitor: ${domain} for ${keyword}`);
    const audit = await runCompetitorAuditAgent(keyword, domain, userId);
    res.json({ success: true, audit, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/adopt", async (req: any, res) => {
  const userId = req.user.uid;
  const { auditData, marketContext } = req.body;

  if (!auditData) {
    return res.status(400).json({ error: "Missing audit data" });
  }

  const idempotencyKey = `adopt-${userId}-${Date.now()}`;

  // Apply Layer 2 Decision
  const plan = Layer2Brain.formulateActionPlan({
    action: "STRATEGY_ADOPTION",
    target: "internal_blueprint",
    impact: "medium",
    reversibility: "high",
    factors: ["api_cost", "reversible"],
    params: { auditData, marketContext }
  });

  // Layer 3 Execution
  const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  try {
    console.log(`[Strategy] Formulating adoption blueprint for user: ${userId}`);
    const blueprint = await runStrategyAdoptionAgent(auditData, marketContext || "General Market Expansion", userId);
    res.json({ success: true, blueprint, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const strategyRouter = router;
