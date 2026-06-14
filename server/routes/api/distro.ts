import { Router } from "express";
import { runSocialCopyAgent, runImageGenerationAgent, runCustomPinAgent, runTrafficEngineAgent, runAffiliateMatchAgent } from "../../agents";
import { Layer2Brain, Layer3Execution } from "../../services/architectureLayers";
import { db } from "../../firebaseAdmin";

const router = Router();

router.post("/social-copy", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { id, collection: colName } = req.body;
    if (!id || !colName) return res.status(400).json({ error: "Missing id/collection" });

    const docRef = db.collection(colName).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: "Document not found" });

    const item = docSnap.data();
    const title = item?.title || item?.keyword || "Affiliate Masterclass";
    const keyword = item?.keyword || "affiliate marketing";
    const content = item?.content || item?.description || "";

    const idempotencyKey = `social-${userId}-${id}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "SOCIAL_SYNDICATION",
      target: "multi_channel_distro",
      impact: "low",
      reversibility: "high",
      factors: ["api_cost", "cache_only"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const copy = await runSocialCopyAgent(title, keyword, content, userId);
    
    await docRef.set({
      twitterPostContent: copy.twitterPost,
      linkedinPostContent: copy.linkedinPost,
      updatedAt: Date.now()
    }, { merge: true });

    res.json({ success: true, ...copy, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pins/generate", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { concept, title, description } = req.body;
    if (!concept) return res.status(400).json({ error: "Concept required" });

    const idempotencyKey = `pin-gen-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "PINTEREST_CREATIVE",
      target: "visual_assets",
      impact: "medium",
      reversibility: "high",
      factors: ["api_cost", "reversible"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const pin = await runCustomPinAgent(concept, title, description, userId);
    res.json({ success: true, pin, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/traffic/engine", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: "Keyword required" });

    const idempotencyKey = `traffic-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "TRAFFIC_GENERATION",
      target: "market_intelligence",
      impact: "low",
      reversibility: "high",
      factors: ["api_cost", "cache_only"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const raw = await runTrafficEngineAgent(keyword, userId);
    res.json({ success: true, analysis: JSON.parse(raw), auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/affiliate/match", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: "Keyword required" });

    const idempotencyKey = `match-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "AFFILIATE_MATCHING",
      target: "monetization_matrix",
      impact: "medium",
      reversibility: "high",
      factors: ["api_cost", "reversible"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const raw = await runAffiliateMatchAgent(keyword, userId);
    res.json({ success: true, matches: JSON.parse(raw), auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pins/regenerate", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: "Concept required" });

    const idempotencyKey = `pin-regen-${userId}-${Date.now()}`;
    const plan = Layer2Brain.formulateActionPlan({
      action: "PINTEREST_REGEN",
      target: "visual_assets",
      impact: "medium",
      reversibility: "high",
      factors: ["api_cost", "reversible"]
    });

    const result = await Layer3Execution.executeActionPlan(userId, plan, idempotencyKey);
    if (!result.success) return res.status(500).json({ error: result.error });

    const imageUrl = await runImageGenerationAgent(concept, userId);
    res.json({ success: true, imageUrl, auditLogId: result.auditLogId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const distroRouter = router;
