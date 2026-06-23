import { Router } from "express";
import { BusinessAnalystAgent } from "../../services/businessAnalystAgent";

const router = Router();

router.post("/generate-report", async (req: any, res) => {
  const userId = req.user?.uid || "mock-user-id";
  
  try {
    const report = await BusinessAnalystAgent.generateDailyExecutiveReport(userId);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
