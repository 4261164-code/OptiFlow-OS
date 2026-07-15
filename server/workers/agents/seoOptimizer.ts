import { db } from "../../firebaseAdmin";
import { logger } from "../../lib/logger";

export async function seoOptimizer(articleId: string) {
  try {
     const articleDoc = await db.collection("content").doc(articleId).get();
     if (!articleDoc.exists) return;

     const article = articleDoc.data();
     
     // In a real system, we would query Google Search Console here for the specific article.
     // For this loop, we simulate retrieving Search Console metrics.
     const metrics = await getSearchMetrics(article?.keyword);

     if (!metrics) {
        logger.warn(`[SEO Optimizer] Skipping optimization for ${articleId} due to missing metrics.`);
        return;
     }

     if (metrics.ctr < 2) {
       await queueJob("seo", { action: "rewrite_title", articleId });
       logger.info(`[SEO Optimizer] Low CTR (${metrics.ctr}%) detected for ${articleId}. Queued title rewrite.`);
     }

     if (metrics.position > 10) {
       await queueJob("content", { action: "content_upgrade", articleId });
       logger.info(`[SEO Optimizer] Low Position (${metrics.position}) detected for ${articleId}. Queued content upgrade.`);
     }

     if (metrics.impressions > 1000 && metrics.clicks < 50) {
       await queueJob("seo", { action: "meta_description_fix", articleId });
       logger.info(`[SEO Optimizer] High impressions but low clicks detected for ${articleId}. Queued meta fix.`);
     }

  } catch (error: any) {
     logger.error(`[SEO Optimizer] Error running optimizer: ${error.message}`);
  }
}

async function getSearchMetrics(keyword: string) {
    logger.warn(`[SEO Optimizer] GSC integration not fully wired. Skipping metrics retrieval for keyword: ${keyword}`);
    return null;
}

async function queueJob(type: string, payload: any) {
    await db.collection("jobs").add({
        type: type,
        status: "pending",
        payload: payload,
        retry_count: 0,
        created_at: Date.now()
    });
}
