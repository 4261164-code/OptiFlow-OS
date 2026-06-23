import { Router } from "express";
import { db } from "../../firebaseAdmin";

const router = Router();

// GET /api/analytics/overview
router.get("/overview", async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    // 1. Revenue Today
    const conversionsSnap = await db.collection("conversions")
      .where("timestamp", ">=", startOfDay)
      .get();
    
    let revenueToday = 0;
    conversionsSnap.forEach(doc => {
      revenueToday += doc.data().revenue || 0;
    });

    // 2. Top Article
    const clicksSnap = await db.collection("clicks")
      .where("timestamp", ">=", startOfDay)
      .get();
    
    let totalClicks = clicksSnap.size;
    let contentClicks: Record<string, number> = {};
    clicksSnap.forEach(doc => {
      const data = doc.data();
      contentClicks[data.content_id] = (contentClicks[data.content_id] || 0) + 1;
    });

    let topArticle = "None";
    let maxClicks = 0;
    for (const [contentId, clicks] of Object.entries(contentClicks)) {
      if (clicks > maxClicks) {
        maxClicks = clicks;
        topArticle = contentId;
      }
    }

    // 3. Best EPC Offer
    // For simplicity, calculate EPC across all time or just fetch pre-calculated EPC
    let bestEpcOffer = "None";
    const offersSnap = await db.collection("offers").orderBy("epc", "desc").limit(1).get();
    if (!offersSnap.empty) {
        bestEpcOffer = offersSnap.docs[0].data().name || offersSnap.docs[0].id;
    }

    // 4. CTR & Conversion Rate
    const impressions = 1000; // Mocked or fetched from GSC
    const ctr = totalClicks > 0 ? (totalClicks / impressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (conversionsSnap.size / totalClicks) * 100 : 0;

    res.json({
      revenue_today: Number(revenueToday.toFixed(2)),
      top_article: topArticle,
      best_epc_offer: bestEpcOffer,
      ctr: Number(ctr.toFixed(2)),
      conversion_rate: Number(conversionRate.toFixed(2)),
      total_clicks: totalClicks,
      total_conversions: conversionsSnap.size
    });

  } catch (error: any) {
    console.error("[Analytics] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
