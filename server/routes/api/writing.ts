import { Router } from "express";
import { runEbookCreatorAgent, runSEOLinkAgent } from "../../agents";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";

const router = Router();

router.post("/seo-link-agent", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { articleContent, offers } = req.body;
    if (!articleContent || !offers) return res.status(400).json({ error: "Content and offers required" });

    const idempotencyKey = `seo-link-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "SEO_LINK_OPTIMIZATION",
      target: "content_monetization",
      impact: "low",
      reversibility: "high",
      factors: ["api_cost", "cache_only"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const optimizedContent = await runSEOLinkAgent(articleContent, offers, userId);
    res.json({ optimizedContent, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ebook-creator", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required for EBook generation." });
    }

    const idempotencyKey = `ebook-${userId}-${topic.substring(0, 20)}-${Date.now()}`;
    
    // Apply Layer 2 Decision
    const plan = Layer2Brain.formulateActionPlan({
      action: "EBOOK_GENERATION",
      target: "content_archives",
      impact: "high",
      reversibility: "high",
      factors: ["api_cost", "reversible"],
      params: { topic }
    });

    // Layer 3 Execution
    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const ebook = await runEbookCreatorAgent(topic, userId);
    res.json({ success: true, ebook, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const writingRouter = router;
