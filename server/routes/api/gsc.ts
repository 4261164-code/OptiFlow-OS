import { Router } from "express";
import { GoogleSearchConsoleService } from "../../services/gscService";

const router = Router();

router.post("/sync", async (req: any, res) => {
  const userId = req.user?.uid || "mock-user-id";
  const { propertyUrl } = req.body;

  if (!propertyUrl) {
    return res.status(400).json({ error: "Property URL required" });
  }

  // Mock data for the demonstration
  const mockMetrics = [
    { date: new Date().toISOString(), query: "affiliate marketing", clicks: 45, impressions: 800, ctr: 0.056, position: 3.2, page: "/" },
    { date: new Date().toISOString(), query: "seo automation", clicks: 12, impressions: 300, ctr: 0.04, position: 5.1, page: "/tech" }
  ];

  try {
    const success = await GoogleSearchConsoleService.syncDailyData(userId, propertyUrl, mockMetrics);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/insights", async (req: any, res) => {
  const userId = req.user?.uid || "mock-user-id";
  const { propertyUrl } = req.query;

  if (!propertyUrl) {
    return res.status(400).json({ error: "Property URL required" });
  }

  try {
    const decliningPages = await GoogleSearchConsoleService.detectDecliningPages(userId, propertyUrl as string);
    const risingKeywords = await GoogleSearchConsoleService.detectRisingKeywords(userId, propertyUrl as string);
    const topPages = await GoogleSearchConsoleService.getTopPages(userId, propertyUrl as string);

    res.json({ decliningPages, risingKeywords, topPages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
