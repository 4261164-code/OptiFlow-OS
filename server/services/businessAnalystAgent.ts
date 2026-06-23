import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";
import { GoogleGenAI } from "@google/genai";
import { RevenueEngine } from "./revenueEngine";
import { GoogleSearchConsoleService } from "./gscService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DailyExecutiveReport {
  timestamp: string;
  revenue: {
    yesterday: number;
    last7Days: number;
    last30Days: number;
  };
  traffic: {
    topSources: Array<{ source: string; visits: number }>;
    fastestGrowingPages: Array<{ page: string; growth: number }>;
    highestCtrPages: Array<{ page: string; ctr: number }>;
  };
  affiliatePerformance: {
    highestEpcOffers: Array<{ offer: string; epc: number }>;
    highestRevenueOffers: Array<{ offer: string; revenue: number }>;
    underperformingOffers: Array<{ offer: string; reason: string }>;
  };
  contentPerformance: {
    topArticles: Array<{ title: string; views: number }>;
    decliningArticles: Array<{ title: string; drop: number }>;
    refreshOpportunities: Array<{ title: string; reason: string }>;
  };
  creatorPerformance: {
    topCreators: Array<{ name: string; revenue: number }>;
    conversionLeaders: Array<{ name: string; cvr: number }>;
    commissionLeaders: Array<{ name: string; commissions: number }>;
  };
  forecasting: {
    expectedMonthlyRevenue: number;
    expectedTrafficGrowth: number;
    expectedConversionGrowth: number;
  };
  actions: string[];
}

export class BusinessAnalystAgent {
  static async generateDailyExecutiveReport(userId: string): Promise<DailyExecutiveReport> {
    logger.info(`[BusinessAnalyst] Generating daily executive report for ${userId}`);
    
    // In production, this would aggregate data from Firestore collections for:
    // clicks, postbacks, gsc_metrics, webops_ledger
    
    // Simulating aggregated data gathering
    const aggregatedData = {
      revenueYesterday: 420.50,
      revenue7: 3100.20,
      revenue30: 12450.00,
      topSources: [
        { source: "Pinterest Organic", visits: 4500 },
        { source: "Google Organic", visits: 3200 }
      ],
      fastestGrowingPages: [
        { page: "/ai-automation", growth: 45 },
        { page: "/pinterest-seo", growth: 22 }
      ],
      highestCtrPages: [
        { page: "/best-tools", ctr: 8.5 },
        { page: "/case-study", ctr: 7.2 }
      ],
      highestEpcOffers: [
        { offer: "AI Copywriter Pro", epc: 1.45 },
        { offer: "Pinterest Scheduler", epc: 2.10 }
      ],
      highestRevenueOffers: [
        { offer: "AI Copywriter Pro", revenue: 5400 },
        { offer: "SEO Suite", revenue: 4200 }
      ],
      underperformingOffers: [
        { offer: "Old Course", reason: "EPC dropped below $0.20" }
      ],
      contentPerformance: {
        topArticles: [
          { title: "Definitive Guide to Affiliate Marketing", views: 15400 },
          { title: "Top 10 Automated SEO Tools", views: 9200 }
        ],
        decliningArticles: [
          { title: "2024 Social Media Trends", drop: 15 }
        ],
        refreshOpportunities: [
          { title: "Best Email Marketing Software (Needs 2026 Update)", reason: "High impression, dropping CTR" }
        ]
      },
      creatorPerformance: {
        topCreators: [
          { name: "Jane Smith", revenue: 3200 },
          { name: "Alex Chen", revenue: 2150 }
        ],
        conversionLeaders: [
          { name: "Jane Smith", cvr: 4.5 }
        ],
        commissionLeaders: [
          { name: "Jane Smith", commissions: 1600 }
        ]
      },
      forecasting: {
        expectedMonthlyRevenue: 15200,
        expectedTrafficGrowth: 12.5,
        expectedConversionGrowth: 2.1
      }
    };

    const prompt = `
      You are an elite autonomous business analyst and CEO intelligence assistant.
      Review the following daily performance data and generate standard strategic recommendations.
      If revenue increases, identify the most likely driver.
      If revenue decreases, identify the root cause.
      If an article performs well, recommend similar content.
      If an offer underperforms, recommend replacement or traffic pause.
      
      Data: 
      ${JSON.stringify(aggregatedData, null, 2)}
      
      Output exactly 3 strategic next actions (strings in a JSON array format like ["Action 1", "Action 2", "Action 3"]). Do not use markdown blocks, output JSON only.
    `;

    let actions = ["Scale Pinterest Organic traffic", "Replace 'Old Course' offer with better alternative", "Double down on /ai-automation content"];
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const text = response.text || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
            actions = parsed;
        }
    } catch (e: any) {
        logger.error(`[BusinessAnalyst] Error generating insights: ${e.message}`);
    }

    const report: DailyExecutiveReport = {
      timestamp: new Date().toISOString(),
      revenue: {
        yesterday: aggregatedData.revenueYesterday,
        last7Days: aggregatedData.revenue7,
        last30Days: aggregatedData.revenue30
      },
      traffic: {
        topSources: aggregatedData.topSources,
        fastestGrowingPages: aggregatedData.fastestGrowingPages,
        highestCtrPages: aggregatedData.highestCtrPages
      },
      affiliatePerformance: {
        highestEpcOffers: aggregatedData.highestEpcOffers,
        highestRevenueOffers: aggregatedData.highestRevenueOffers,
        underperformingOffers: aggregatedData.underperformingOffers
      },
      contentPerformance: aggregatedData.contentPerformance,
      creatorPerformance: aggregatedData.creatorPerformance,
      forecasting: aggregatedData.forecasting,
      actions
    };

    // Store the report
    await db.collection(`users/${userId}/executive_reports`).add(report);

    return report;
  }
}
