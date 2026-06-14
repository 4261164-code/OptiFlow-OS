import { Router } from "express";
import { runDeepKeywordExplorerAgent, runSEOClusterAgent, runReportDigestAgent } from "../../agents";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";

const router = Router();

router.post("/keywords", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { keyword, country, language } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword required" });
    }

    const idempotencyKey = `kw-${userId}-${keyword.substring(0, 20)}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "KEYWORD_RESEARCH",
      target: "market_intelligence",
      impact: "low",
      reversibility: "high",
      factors: ["api_cost", "cache_only"],
      params: { keyword, country, language }
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const analysis = await runDeepKeywordExplorerAgent(keyword, country, language, userId);
    res.json({ success: true, analysis, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/clusters", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { pillarTopic } = req.body;
    if (!pillarTopic) {
      return res.status(400).json({ error: "Pillar Topic is required" });
    }

    const idempotencyKey = `cluster-${userId}-${pillarTopic.substring(0, 20)}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "SEO_CLUSTERING",
      target: "content_blueprint",
      impact: "medium",
      reversibility: "high",
      factors: ["api_cost", "reversible"],
      params: { pillarTopic }
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const cluster = await runSEOClusterAgent(pillarTopic, userId);
    res.json({ success: true, cluster, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/digest", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { documentText, docType } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: "Document text is required" });
    }

    const idempotencyKey = `digest-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "REPORT_DIGEST",
      target: "executive_intelligence",
      impact: "low",
      reversibility: "high",
      factors: ["api_cost", "cache_only"],
      params: { docType }
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const analysis = await runReportDigestAgent(documentText, docType || "weekly-report", userId);
    res.json({ success: true, analysis, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const intelRouter = router;
