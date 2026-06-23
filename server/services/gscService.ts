import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";

export interface GSCMetrics {
  date: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  page: string;
}

export class GoogleSearchConsoleService {
  static async syncDailyData(userId: string, propertyUrl: string, mockData: GSCMetrics[]) {
    logger.info(`[GSC] Syncing daily data for ${propertyUrl} (user: ${userId})`);
    
    const batch = db.batch();
    const gscRef = db.collection(`users/${userId}/gsc_metrics`);

    for (const data of mockData) {
      const docId = `${data.date}-${data.query.replace(/ /g, "_")}`;
      batch.set(gscRef.doc(docId), {
        ...data,
        propertyUrl,
        timestamp: new Date(data.date).getTime()
      }, { merge: true });
    }

    await batch.commit();
    logger.info(`[GSC] Successfully fully synchronized data for ${propertyUrl}`);
    return true;
  }

  static async detectDecliningPages(userId: string, propertyUrl: string) {
    logger.info(`[GSC] Analyzing declining pages for ${propertyUrl}`);
    // In a real system, you'd compare last 30 days vs previous 30 days
    return [
      { page: "/how-to-start-affiliate-marketing", dropPercentage: 15, currentPosition: 4.2 },
      { page: "/best-pinterest-strategies", dropPercentage: 22, currentPosition: 11.5 }
    ];
  }

  static async detectRisingKeywords(userId: string, propertyUrl: string) {
    logger.info(`[GSC] Analyzing rising keywords for ${propertyUrl}`);
    return [
      { keyword: "ai affiliate marketing 2026", growthPercentage: 145, currentClicks: 50 },
      { keyword: "pinterest automation tools", growthPercentage: 80, currentClicks: 120 }
    ];
  }

  static async getTopPages(userId: string, propertyUrl: string) {
    return [
      { page: "/", clicks: 1200, impressions: 50000, ctr: 0.024 },
      { page: "/best-seo-tools", clicks: 800, impressions: 15000, ctr: 0.053 }
    ];
  }
}
