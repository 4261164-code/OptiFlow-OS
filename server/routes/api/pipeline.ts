import { Router } from "express";
import { runPipeline } from "../../pipeline";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";

const router = Router();

router.post("/run", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { 
      jobId,
      keyword, 
      articleLength, 
      seoLevel, 
      country, 
      language, 
      tone, 
      numPins, 
      hasFaq, 
      internalLinks, 
      externalLinks, 
      affiliateOffers,
      existingArticleTitle,
      existingArticleContent
    } = req.body;

    if (!keyword) return res.status(400).json({ error: "Keyword required" });

    const targetJobId = jobId || `job-${Date.now()}`;
    const idempotencyKey = `pipeline-${userId}-${targetJobId}`;
    
    const plan = Layer2Brain.formulateActionPlan({
      action: "CONTENT_PIPELINE",
      target: "multi_agent_pipeline",
      impact: "high",
      reversibility: "high",
      factors: ["api_cost", "payment_impact"],
      params: { keyword, seoLevel, numPins }
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const pipelineResult = await runPipeline({
      userId,
      jobId: targetJobId,
      keyword,
      articleLength: articleLength ? Number(articleLength) : undefined,
      seoLevel,
      country,
      language,
      tone,
      numPins: numPins !== undefined ? Number(numPins) : undefined,
      hasFaq: hasFaq !== undefined ? Boolean(hasFaq) : undefined,
      internalLinks: internalLinks !== undefined ? Boolean(internalLinks) : undefined,
      externalLinks: externalLinks !== undefined ? Boolean(externalLinks) : undefined,
      affiliateOffers,
      existingArticleTitle,
      existingArticleContent
    });

    res.json({
      success: true,
      jobId: targetJobId,
      ...pipelineResult,
      auditLogId: result.auditLogId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const pipelineRouter = router;
