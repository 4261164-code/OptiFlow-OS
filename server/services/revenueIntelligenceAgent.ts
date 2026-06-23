import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AttributionAnalytics {
  epc: number;
  conversionRate: number;
  revenuePerVisitor: number;
  revenuePerArticle: Record<string, number>;
  revenuePerCreator: Record<string, number>;
  topOffers: any[];
  winningOffers: any[];
  losingOffers: any[];
  aiRecommendations: string[];
}

export class RevenueIntelligenceAgent {
  static async runAttributionAnalysis(userId: string): Promise<AttributionAnalytics> {
    logger.info(`[RevenueIntelligence] Running attribution analysis for user: ${userId}`);

    // Fetch the last 1000 clicks to build sample data
    const clicksSnap = await db.collection("affiliate_clicks")
        // .where("userId", "==", userId)  // In a multi-tenant setup we would scope this
        .limit(1000)
        .get();

    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    const articleStats: Record<string, { clicks: number, revenue: number }> = {};
    const creatorStats: Record<string, { clicks: number, revenue: number }> = {};
    const offerStats: Record<string, { clicks: number, conversions: number, revenue: number, name?: string }> = {};

    clicksSnap.forEach(doc => {
      const data = doc.data();
      totalClicks++;
      
      const articleId = data.articleId || "direct";
      const creatorId = data.userId || "anonymous";
      const offerId = data.offerId || "unknown";

      if (!articleStats[articleId]) articleStats[articleId] = { clicks: 0, revenue: 0 };
      if (!creatorStats[creatorId]) creatorStats[creatorId] = { clicks: 0, revenue: 0 };
      if (!offerStats[offerId]) offerStats[offerId] = { clicks: 0, conversions: 0, revenue: 0, name: data.offerName || offerId };

      articleStats[articleId].clicks++;
      creatorStats[creatorId].clicks++;
      offerStats[offerId].clicks++;
    });

    const convSnap = await db.collection("affiliate_conversions")
        // .where("userId", "==", userId)
        .limit(1000)
        .get();

    convSnap.forEach(doc => {
      const data = doc.data();
      totalConversions++;
      const revenue = data.amount || 0;
      totalRevenue += revenue;

      const articleId = data.articleId || "direct";
      const creatorId = data.userId || "anonymous";
      const offerId = data.offerId || "unknown";

      if (articleStats[articleId]) articleStats[articleId].revenue += revenue;
      if (creatorStats[creatorId]) creatorStats[creatorId].revenue += revenue;
      if (offerStats[offerId]) {
          offerStats[offerId].conversions++;
          offerStats[offerId].revenue += revenue;
      }
    });

    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const revenuePerVisitor = totalClicks > 0 ? totalRevenue / totalClicks : 0; // Same as EPC for simple flat funnel

    const revenuePerArticle: Record<string, number> = {};
    Object.entries(articleStats).forEach(([id, stats]) => {
      revenuePerArticle[id] = stats.revenue;
    });

    const revenuePerCreator: Record<string, number> = {};
    Object.entries(creatorStats).forEach(([id, stats]) => {
      revenuePerCreator[id] = stats.revenue;
    });

    const offersArray = Object.entries(offerStats).map(([id, stats]) => ({
      id,
      name: stats.name,
      epc: stats.clicks > 0 ? stats.revenue / stats.clicks : 0,
      conversionRate: stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0,
      revenue: stats.revenue
    }));

    const sortedOffers = offersArray.sort((a, b) => b.revenue - a.revenue);

    // AI Analysis
    const prompt = `
      You are the MaxBounty Revenue Intelligence AI.
      Review the affiliate network performance data and determine:
      1. Winning offers (high EPC, high conversion, high revenue)
      2. Losing offers (low or zero EPC, poor conversions)
      3. Strategic recommendations for replacements to optimize affiliate income automatically.
      
      Data metrics:
      EPC: $${epc.toFixed(2)}
      Conversion Rate: ${conversionRate.toFixed(2)}%
      
      Offer Data:
      ${JSON.stringify(sortedOffers, null, 2)}
      
      Output exactly a JSON object with:
      {
        "winning_offers": ["ID or Name 1", "ID or Name 2"],
        "losing_offers": ["ID or Name 1"],
        "recommendations": ["Strategy 1", "Strategy 2"]
      }
      Do not use markdown blocks, output raw JSON.
    `;

    let aiRecommendations = ["Pause lower performing offers", "Route more traffic to top converting articles."];
    let winningOffers = sortedOffers.slice(0, 2);
    let losingOffers = sortedOffers.slice(-2);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const text = response.text || "";
        const parsed = JSON.parse(text);
        if (parsed.recommendations) {
            aiRecommendations = parsed.recommendations;
        }
        if (parsed.winning_offers && Array.isArray(parsed.winning_offers)) {
           // Mapping IDs back
        }
    } catch (e: any) {
        logger.error(`[RevenueIntelligence] Error generating insights: ${e.message}`);
    }

    return {
      epc,
      conversionRate,
      revenuePerVisitor,
      revenuePerArticle,
      revenuePerCreator,
      topOffers: sortedOffers,
      winningOffers,
      losingOffers,
      aiRecommendations
    };
  }
}
