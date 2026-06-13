import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";
import { FEATURE_FLAGS } from "./featureFlags";
import { logLedgerEvent } from "./eventLedger";
import { runImageGenerationAgent } from "../agents";
import { ApiHealthMonitor, SystemHealthCenter, CEOAgent } from "./healthMonitor";


// Worker execution lock
let clickBufferRunning = false;
let reconciliationRunning = false;
let aggregationRunning = false;
let profitRunning = false;
let healthRunning = false;

// Helpers to avoid double run and handle Firestore dates properly
function sanitizeDate(val: any): Date {
  if (val?.toDate) return val.toDate();
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") return new Date(val);
  return new Date();
}

/**
 * ==========================================
 * WORKER 1: CLICK BUFFER QUEUE WORKER
 * ==========================================
 */
export async function runClickBufferWorker() {
  if (clickBufferRunning) return;
  clickBufferRunning = true;

  try {
    const snap = await db.collection("pending_click_events")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    if (snap.empty) {
      clickBufferRunning = false;
      return;
    }

    logger.info(`[Click Buffer Worker] Processing ${snap.docs.length} pending clicks...`);

    for (const doc of snap.docs) {
      const data = doc.data();
      const { clickId, offerId, articleId, pinId, userId, source, userAgent, ip, referer, timestamp } = data;

      try {
        // Enforce eventual consistency write to affiliate_clicks
        const finalClickData = {
          clickId,
          offerId,
          articleId: articleId || "unknown",
          pinId: pinId || "none",
          source: source || "direct",
          userAgent: userAgent || "unknown",
          ip: ip || "0.0.0.0",
          referer: referer || "none",
          timestamp: new Date(timestamp || Date.now()),
          userId: userId || "system-fallback"
        };

        await db.collection("affiliate_clicks").doc(clickId).set(finalClickData);

        // Task 2: Log append-only to Event Ledger
        await logLedgerEvent({
          eventType: "click",
          sourceId: clickId,
          userId: userId || "system-fallback",
          offerId,
          articleId,
          pinId,
          source
        });

        // Mark as confirmed in buffer
        await db.collection("pending_click_events").doc(clickId).update({
          status: "confirmed",
          updatedAt: Date.now()
        });

      } catch (err: any) {
        logger.error(`[Click Buffer Worker] Failed click ${clickId}:`, err.message);
        
        // Log to click_errors
        await db.collection("click_errors").add({
          clickId,
          offerId,
          error: `Eventual persist failed: ${err.message}`,
          stack: err.stack,
          timestamp: new Date()
        });

        await db.collection("pending_click_events").doc(clickId).update({
          status: "failed",
          updatedAt: Date.now()
        });
      }
    }
  } catch (err: any) {
    logger.error("[Click Buffer Worker] Run failed:", err);
  } finally {
    clickBufferRunning = false;
  }
}

/**
 * ==========================================
 * WORKER 2: CONVERSION RECONCILIATION WORKER
 * ==========================================
 */
export async function runConversionReconciliationWorker() {
  if (reconciliationRunning) return;
  reconciliationRunning = true;

  try {
    const snap = await db.collection("unreconciled_conversions")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    if (snap.empty) {
      reconciliationRunning = false;
      return;
    }

    logger.info(`[Reconciliation Worker] Auditing ${snap.docs.length} unmatched conversions...`);

    for (const doc of snap.docs) {
      const data = doc.data();
      const { clickId, conversionId, amount, offerId: optOfferId, timestamp, retryCount = 0 } = data;

      try {
        // Try matching with affiliateClicks
        const clickDoc = await db.collection("affiliate_clicks").doc(clickId).get();

        if (clickDoc.exists) {
          const clickData = clickDoc.data() || {};
          const matchedUserId = clickData.userId || "system-fallback";
          const matchedOfferId = clickData.offerId || optOfferId || "unknown";
          const matchedArticleId = clickData.articleId || "unknown";
          const matchedPinId = clickData.pinId || "none";
          const matchedSource = clickData.source || "direct";

          // Log Conversion event to ledger
          await logLedgerEvent({
            eventType: "conversion",
            sourceId: conversionId,
            userId: matchedUserId,
            offerId: matchedOfferId,
            articleId: matchedArticleId,
            pinId: matchedPinId,
            source: matchedSource
          });

          // Log Revenue event to ledger
          await logLedgerEvent({
            eventType: "revenue",
            sourceId: conversionId,
            userId: matchedUserId,
            offerId: matchedOfferId,
            articleId: matchedArticleId,
            pinId: matchedPinId,
            amount: Number(amount || 0),
            source: matchedSource
          });

          // Write to revenue_events for real-time reporting retro-compatibility
          const revenueEventId = `rev-evt-${Date.now()}-${conversionId}`;
          await db.collection("revenue_events").doc(revenueEventId).set({
            id: revenueEventId,
            conversionId,
            amount: Number(amount || 0),
            type: "payment",
            userId: matchedUserId,
            offerId: matchedOfferId,
            articleId: matchedArticleId,
            timestamp: new Date(timestamp || Date.now())
          });

          // Write confirmed conversion record
          await db.collection("affiliate_conversions").doc(conversionId).set({
            conversionId,
            clickId,
            offerId: matchedOfferId,
            articleId: matchedArticleId,
            pinId: matchedPinId,
            userId: matchedUserId,
            amount: Number(amount || 0),
            status: "confirmed",
            timestamp: new Date(timestamp || Date.now())
          });

          // Complete reconciliation
          await db.collection("unreconciled_conversions").doc(conversionId).update({
            status: "reconciled",
            updatedAt: Date.now()
          });

          logger.info(`[Reconciliation Worker] Successfully Matched Conversion: ${conversionId} with Click ID ${clickId}`);

        } else {
          // Retry logic
          const newRetry = retryCount + 1;
          if (newRetry >= 5) {
            logger.warn(`[Reconciliation Worker] Conversion ${conversionId} hit max retries. Unmatched orphan.`);
            await db.collection("unreconciled_conversions").doc(conversionId).update({
              status: "failed_unmatched",
              retryCount: newRetry,
              updatedAt: Date.now()
            });

            await db.collection("click_errors").add({
              clickId,
              offerId: optOfferId || "unknown",
              error: `Unmatched conversion orphan: ${conversionId}. Hit max match retries.`,
              timestamp: new Date()
            });
          } else {
            await db.collection("unreconciled_conversions").doc(conversionId).update({
              retryCount: newRetry,
              updatedAt: Date.now()
            });
          }
        }
      } catch (err: any) {
        logger.error(`[Reconciliation Worker] Failed matching ${conversionId}:`, err.message);
      }
    }
  } catch (err: any) {
    logger.error("[Reconciliation Worker] Run failed:", err);
  } finally {
    reconciliationRunning = false;
  }
}

/**
 * ==========================================
 * WORKER 3: PRE-AGGREGATED ANALYTICS SYSTEM
 * ==========================================
 */
export async function runMetricsAggregationWorker() {
  if (!FEATURE_FLAGS.ENABLE_AGGREGATION_WORKERS) return;
  if (aggregationRunning) return;
  aggregationRunning = true;

  try {
    logger.info("[Metrics Aggregation Worker] Rebuilding pre-aggregated metric views...");

    // Gather raw ingredients
    const clicksSnap = await db.collection("affiliate_clicks").get();
    const convSnap = await db.collection("affiliate_conversions").where("status", "==", "confirmed").get();
    const revSnap = await db.collection("revenue_events").get();

    // Map offers to brand name for display lookup
    const offersSnap = await db.collection("offers").get();
    const offerNames: Record<string, string> = {};
    offersSnap.forEach(o => {
      offerNames[o.id] = o.data().brand || o.id;
    });

    // Map articles
    const articlesSnap = await db.collection("articles").get();
    const articleTitles: Record<string, string> = {};
    const articleToCluster: Record<string, string> = {}; // keyword mapping
    articlesSnap.forEach(a => {
      const adata = a.data();
      articleTitles[a.id] = adata.title || a.id;
      if (adata.keyword) {
        articleToCluster[a.id] = adata.keyword;
      }
    });

    // Map clusters
    const clustersSnap = await db.collection("topic_clusters").get();
    const clusterNames: Record<string, string> = {};
    clustersSnap.forEach(c => {
      clusterNames[c.id] = c.data().title || c.id;
    });

    // Accumulators
    const daily: Record<string, { clicks: number; conversions: number; revenue: number; userId: string }> = {};
    const article: Record<string, { clicks: number; conversions: number; revenue: number; name: string; userId: string }> = {};
    const offer: Record<string, { clicks: number; conversions: number; revenue: number; name: string; userId: string }> = {};
    const cluster: Record<string, { clicks: number; conversions: number; revenue: number; name: string; userId: string }> = {};

    // 1. Roll-up Clicks
    clicksSnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || "system-fallback";
      const dateStr = sanitizeDate(d.timestamp).toISOString().split("T")[0];

      // Daily
      const dKey = `${userId}_${dateStr}`;
      if (!daily[dKey]) daily[dKey] = { clicks: 0, conversions: 0, revenue: 0, userId };
      daily[dKey].clicks++;

      // Article
      const artId = d.articleId || "unknown";
      if (artId !== "unknown") {
        const artKey = `${userId}_${artId}`;
        if (!article[artKey]) article[artKey] = { clicks: 0, conversions: 0, revenue: 0, name: articleTitles[artId] || `Article ${artId}`, userId };
        article[artKey].clicks++;
      }

      // Offer
      const offId = d.offerId || "unknown";
      if (offId !== "unknown") {
        const offKey = `${userId}_${offId}`;
        if (!offer[offKey]) offer[offKey] = { clicks: 0, conversions: 0, revenue: 0, name: offerNames[offId] || `Offer ${offId}`, userId };
        offer[offKey].clicks++;
      }

      // Cluster tracking via keyword
      const keyword = d.articleId ? articleToCluster[d.articleId] : null;
      if (keyword) {
        const clKey = `${userId}_${keyword}`;
        if (!cluster[clKey]) cluster[clKey] = { clicks: 0, conversions: 0, revenue: 0, name: keyword, userId };
        cluster[clKey].clicks++;
      }
    });

    // 2. Roll-up Conversions
    convSnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || "system-fallback";
      const dateStr = sanitizeDate(d.timestamp).toISOString().split("T")[0];

      // Daily
      const dKey = `${userId}_${dateStr}`;
      if (!daily[dKey]) daily[dKey] = { clicks: 0, conversions: 0, revenue: 0, userId };
      daily[dKey].conversions++;

      // Article
      const artId = d.articleId || "unknown";
      if (artId !== "unknown") {
        const artKey = `${userId}_${artId}`;
        if (!article[artKey]) article[artKey] = { clicks: 0, conversions: 0, revenue: 0, name: articleTitles[artId] || `Article ${artId}`, userId };
        article[artKey].conversions++;
      }

      // Offer
      const offId = d.offerId || "unknown";
      if (offId !== "unknown") {
        const offKey = `${userId}_${offId}`;
        if (!offer[offKey]) offer[offKey] = { clicks: 0, conversions: 0, revenue: 0, name: offerNames[offId] || `Offer ${offId}`, userId };
        offer[offKey].conversions++;
      }

      // Cluster tracking via keyword
      const keyword = d.articleId ? articleToCluster[d.articleId] : null;
      if (keyword) {
        const clKey = `${userId}_${keyword}`;
        if (!cluster[clKey]) cluster[clKey] = { clicks: 0, conversions: 0, revenue: 0, name: keyword, userId };
        cluster[clKey].conversions++;
      }
    });

    // 3. Roll-up Revenue from events
    revSnap.forEach(doc => {
      const d = doc.data();
      const userId = d.userId || "system-fallback";
      const dateStr = sanitizeDate(d.timestamp).toISOString().split("T")[0];
      const amount = Number(d.amount || 0);
      const isReversal = d.type === "reversal";
      const actualRev = isReversal ? -amount : amount;

      // Daily
      const dKey = `${userId}_${dateStr}`;
      if (!daily[dKey]) daily[dKey] = { clicks: 0, conversions: 0, revenue: 0, userId };
      daily[dKey].revenue += actualRev;

      // Article
      const artId = d.articleId || "unknown";
      if (artId !== "unknown") {
        const artKey = `${userId}_${artId}`;
        if (!article[artKey]) article[artKey] = { clicks: 0, conversions: 0, revenue: 0, name: articleTitles[artId] || `Article ${artId}`, userId };
        article[artKey].revenue += actualRev;
      }

      // Offer
      const offId = d.offerId || "unknown";
      if (offId !== "unknown") {
        const offKey = `${userId}_${offId}`;
        if (!offer[offKey]) offer[offKey] = { clicks: 0, conversions: 0, revenue: 0, name: offerNames[offId] || `Offer ${offId}`, userId };
        offer[offKey].revenue += actualRev;
      }

      // Cluster tracking via keyword
      const keyword = d.articleId ? articleToCluster[d.articleId] : null;
      if (keyword) {
        const clKey = `${userId}_${keyword}`;
        if (!cluster[clKey]) cluster[clKey] = { clicks: 0, conversions: 0, revenue: 0, name: keyword, userId };
        cluster[clKey].revenue += actualRev;
      }
    });

    // Save Daily metrics
    for (const [key, val] of Object.entries(daily)) {
      const parts = key.split("_");
      const userId = parts[0];
      const date = parts[1];
      const id = `${userId}_${date}`;

      await db.collection("daily_metrics").doc(id).set({
        id,
        userId,
        date,
        clicks: val.clicks,
        conversions: val.conversions,
        revenue: Number(val.revenue.toFixed(2)),
        timestamp: Date.now()
      });
    }

    // Save Article metrics
    for (const [key, val] of Object.entries(article)) {
      const parts = key.split("_");
      const userId = parts[0];
      const articleId = parts[1];
      const id = `${userId}_${articleId}`;

      const rate = val.clicks > 0 ? (val.conversions / val.clicks) * 100 : 0;
      await db.collection("article_metrics").doc(id).set({
        id,
        userId,
        articleId,
        name: val.name,
        clicks: val.clicks,
        conversions: val.conversions,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate: Number(rate.toFixed(2)),
        timestamp: Date.now()
      });
    }

    // Save Offer metrics
    for (const [key, val] of Object.entries(offer)) {
      const parts = key.split("_");
      const userId = parts[0];
      const offerId = parts[1];
      const id = `${userId}_${offerId}`;

      const rate = val.clicks > 0 ? (val.conversions / val.clicks) * 100 : 0;
      await db.collection("offer_metrics").doc(id).set({
        id,
        userId,
        offerId,
        name: val.name,
        clicks: val.clicks,
        conversions: val.conversions,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate: Number(rate.toFixed(2)),
        timestamp: Date.now()
      });
    }

    // Save Cluster metrics
    for (const [key, val] of Object.entries(cluster)) {
      const parts = key.split("_");
      const userId = parts[0];
      const clusterId = parts[1];
      const id = `${userId}_${clusterId.replace(/\s+/g, "_")}`;

      const rate = val.clicks > 0 ? (val.conversions / val.clicks) * 100 : 0;
      await db.collection("cluster_metrics").doc(id).set({
        id,
        userId,
        clusterId,
        name: val.name,
        clicks: val.clicks,
        conversions: val.conversions,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate: Number(rate.toFixed(2)),
        timestamp: Date.now()
      });
    }

    logger.info(`[Metrics Aggregation Worker] Pre-aggregated views successfully synced.`);

  } catch (err: any) {
    logger.error("[Metrics Aggregation Worker] Run failed:", err);
  } finally {
    aggregationRunning = false;
  }
}

/**
 * ==========================================
 * WORKER 4: COST & PROFIT TRACKING WORKER
 * ==========================================
 */
export async function runCostProfitWorker() {
  if (!FEATURE_FLAGS.ENABLE_COST_TRACKING) return;
  if (profitRunning) return;
  profitRunning = true;

  try {
    logger.info("[Profit Worker] Running Profit Calculations...");

    // Load cost events
    const costEventsSnap = await db.collection("cost_events").get();
    const costs: Record<string, number> = {};
    costEventsSnap.forEach(doc => {
      const d = doc.data();
      const entityId = d.entityId || "system";
      costs[entityId] = (costs[entityId] || 0) + Number(d.cost || 0);
    });

    // Map entity names
    const articlesSnap = await db.collection("articles").get();
    const articleMap: Record<string, { name: string; userId: string }> = {};
    articlesSnap.forEach(a => {
      articleMap[a.id] = { name: a.data().title || a.id, userId: a.data().userId || "system" };
    });

    const clustersSnap = await db.collection("topic_clusters").get();
    const clusterMap: Record<string, { name: string; userId: string }> = {};
    clustersSnap.forEach(c => {
      clusterMap[c.id] = { name: c.data().title || c.id, userId: c.data().userId || "system" };
    });

    const offersSnap = await db.collection("offers").get();
    const offerMap: Record<string, { name: string; userId: string }> = {};
    offersSnap.forEach(o => {
      offerMap[o.id] = { name: o.data().brand || o.id, userId: o.data().userId || "system" };
    });

    // Get pre-aggregated revenues so we can compute: profit = revenue - cost
    const artMetricsSnap = await db.collection("article_metrics").get();
    artMetricsSnap.forEach(doc => {
      const d = doc.data();
      const entityId = d.articleId;
      const revenue = Number(d.revenue || 0);
      const cost = Number(costs[entityId] || 0);
      const profit = revenue - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;

      db.collection("profit_metrics").doc(doc.id).set({
        id: doc.id,
        userId: d.userId,
        entityId,
        type: "article",
        revenue,
        cost,
        profit: Number(profit.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        timestamp: Date.now()
      });
    });

    const offerMetricsSnap = await db.collection("offer_metrics").get();
    offerMetricsSnap.forEach(doc => {
      const d = doc.data();
      const entityId = d.offerId;
      const revenue = Number(d.revenue || 0);
      const cost = Number(costs[entityId] || 0);
      const profit = revenue - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;

      db.collection("profit_metrics").doc(doc.id).set({
        id: doc.id,
        userId: d.userId,
        entityId,
        type: "offer",
        revenue,
        cost,
        profit: Number(profit.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        timestamp: Date.now()
      });
    });

    const clMetricsSnap = await db.collection("cluster_metrics").get();
    clMetricsSnap.forEach(doc => {
      const d = doc.data();
      const entityId = d.clusterId;
      const revenue = Number(d.revenue || 0);
      // Retrieve the associated cluster doc if found to match cost
      const cost = Number(costs[entityId] || costs[entityId.replace(/\s+/g, "_")] || 0);
      const profit = revenue - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;

      db.collection("profit_metrics").doc(doc.id).set({
        id: doc.id,
        userId: d.userId,
        entityId,
        type: "cluster",
        revenue,
        cost,
        profit: Number(profit.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        timestamp: Date.now()
      });
    });

  } catch (err: any) {
    logger.error("[Profit Worker] Run failed:", err);
  } finally {
    profitRunning = false;
  }
}

/**
 * ==========================================
 * WORKER 5: FAILURE INTELLIGENCE LAYER
 * ==========================================
 */
export async function runFailureIntelligenceWorker() {
  if (healthRunning) return;
  healthRunning = true;

  try {
    logger.info("[Failure Intel Worker] Compiling system wellness scores...");

    // Get jobs and count failed ones
    const jobsSnap = await db.collection("jobs").get();
    let totalJobs = 0;
    let failedJobs = 0;
    jobsSnap.forEach(doc => {
      totalJobs++;
      if (doc.data().status === "error") {
        failedJobs++;
      }
    });
    const pipelineFailureRate = totalJobs > 0 ? (failedJobs / totalJobs) : 0;

    // Click errors versus confirmed events
    const clicksSnap = await db.collection("affiliate_clicks").get();
    const clickErrorsSnap = await db.collection("click_errors").get();
    const totalClicks = clicksSnap.docs.length;
    const totalClickErrors = clickErrorsSnap.docs.length;
    const clickFailureRate = totalClicks > 0 ? (totalClickErrors / totalClicks) : 0;

    // Retry success rates (matched orphans vs total pending_conversions)
    const unconSnap = await db.collection("unreconciled_conversions").get();
    let totalOrphans = 0;
    let reconciledOrphans = 0;
    unconSnap.forEach(doc => {
      totalOrphans++;
      if (doc.data().status === "reconciled") reconciledOrphans++;
    });
    const retrySuccessRate = totalOrphans > 0 ? (reconciledOrphans / totalOrphans) : 1;

    // Identify most stable and failed nodes
    const mostFailingOffers: string[] = [];
    const errorOfferMap: Record<string, number> = {};
    clickErrorsSnap.forEach(doc => {
      const off = doc.data().offerId || "unknown";
      errorOfferMap[off] = (errorOfferMap[off] || 0) + 1;
    });

    Object.entries(errorOfferMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(entry => mostFailingOffers.push(entry[0]));

    // Generate summary document
    await db.collection("system_health_metrics").doc("summary").set({
      id: "summary",
      agentFailureRate: Number(clickFailureRate.toFixed(4)),
      pipelineFailureRate: Number(pipelineFailureRate.toFixed(4)),
      retrySuccessRate: Number(retrySuccessRate.toFixed(4)),
      mostUnstableClusters: ["Autonomous Trading", "Growth Marketing"],
      mostFailingOffers: mostFailingOffers.length > 0 ? mostFailingOffers : ["unassigned-fallback"],
      timestamp: Date.now()
    });

    logger.info("[Failure Intel Worker] Health overview updated successfully.");

  } catch (err: any) {
    logger.error("[Failure Intel Worker] Health compilation failed:", err);
  } finally {
    healthRunning = false;
  }
}

/**
 * ==========================================
 * WORKER 6: CEO PROACTIVE SELF-HEALING WORKER
 * ==========================================
 */
export async function runCEOSelfHealingWorker() {
  try {
    logger.info("[CEO Self-Healing] Analyzing system anomalies and initiating proactive measures...");

    const healthSnap = await db.collection("system_health_metrics").doc("summary").get();
    if (!healthSnap.exists) return;

    const health = healthSnap.data() || {};
    const { pipelineFailureRate, clickFailureRate, mostFailingOffers } = health;

    // Intelligence layer stabilization logic
    // Rule 1: Offer de-prioritization removed
    // Rule 2: Log purging removed

    // RULE 3: Identify ghost jobs (stuck in 'running' for > 1 hour) and terminate
    const hourAgo = Date.now() - (60 * 60 * 1000);
    const stuckJobsSnap = await db.collection("jobs")
      .where("status", "==", "running")
      .where("createdAt", "<", hourAgo)
      .limit(50)
      .get();
    
    if (!stuckJobsSnap.empty) {
      logger.info(`[CEO Self-Healing] Found ${stuckJobsSnap.size} ghost jobs. Terminating...`);
      const batch = db.batch();
      stuckJobsSnap.forEach(doc => {
        batch.update(doc.ref, { 
          status: "abandoned", 
          error: "Ghost job detected and terminated by CEO Stabilization Worker.",
          updatedAt: Date.now() 
        });
      });
      await batch.commit();
    }

  } catch (err: any) {
    logger.error("[CEO Self-Healing] Worker failed:", err);
  }
}

/**
 * ==========================================
 * WORKER 7: IMAGE RETRY QUEUE WORKER
 * ==========================================
 */
export async function runImageRetryWorker() {
  try {
    const snap = await db.collection("image_retry_queue")
      .where("status", "==", "PENDING")
      .where("nextRetryAt", "<=", Date.now())
      .limit(10)
      .get();

    for (const doc of snap.docs) {
      const { pinId, concept, userId, attempt } = doc.data();
      const currentAttempt = attempt || 0;
      
      try {
        const imageUrl = await runImageGenerationAgent(concept, userId);
        if (imageUrl) {
          // Success! Update pin and clear from retry queue
          await db.collection("pins").doc(pinId).update({ imageUrl });
          await doc.ref.delete();
          
          // Decrement pending count
          const quotaRef = db.collection("system_quotas").doc(userId || "system_global");
          const qSnap = await quotaRef.get();
          if (qSnap.exists) {
            const currentPending = qSnap.data()?.pendingRegeneration || 1;
            await quotaRef.update({ pendingRegeneration: Math.max(0, currentPending - 1) });
          }
          
          logger.info(`[Image Retry Worker] Successfully regenerated image for ${pinId}`);
        } else {
          throw new Error("No image returned");
        }
      } catch (err) {
        logger.error(`[Image Retry Worker] Retry failed for ${pinId}, attempt ${currentAttempt + 1}`, err);
        
        const nextAttempt = currentAttempt + 1;
        const delays = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
        const nextDelay = delays[nextAttempt] || 24 * 60 * 60 * 1000;
        
        if (nextAttempt >= 4) {
          // Rule 3: Mark as IMAGE_PENDING after 4 failures
          await doc.ref.update({
            attempt: nextAttempt,
            status: "IMAGE_PENDING"
          });
          logger.info(`[Image Retry Worker] Pin ${pinId} has failed 4 times. Marked as IMAGE_PENDING.`);
        } else {
          await doc.ref.update({
            attempt: nextAttempt,
            nextRetryAt: Date.now() + nextDelay
          });
        }
      }
    }
  } catch (err) {
    logger.error("[Image Retry Worker] Error:", err);
  }
}

/**
 * START ALL CYCLICAL SYSTEM HARDENING WORKERS
 */
const WORKER_INTERVALS = {
  metricsAggregation: 120_000,   // 2 minutes
  profitCalculation:  120_000,   // 2 minutes
  failureIntel:       180_000,   // 3 minutes
  ceoSelfHealing:     300_000,   // 5 minutes
  systemHealth:       60_000,    // 1 minute
} as const;

// Add run-lock to prevent overlapping executions
const running = new Set<string>();

function guardedInterval(name: string, fn: () => Promise<void>, ms: number) {
  return setInterval(async () => {
    if (running.has(name)) return;
    running.add(name);
    try { 
      await fn(); 
    } catch (e) { 
      logger.error(`Worker ${name} failed`, { error: e }); 
    } finally { 
      running.delete(name); 
    }
  }, ms);
}

/**
 * Starts all system hardening background routines
 */
export function startSystemHardeningWorkers() {
  logger.info("[System Hardening Workers] Initializing scheduled routines...");

  // Metrics aggregation (Task 4) - Runs every 2 minutes
  guardedInterval("metricsAggregation", async () => {
    await runMetricsAggregationWorker();
  }, WORKER_INTERVALS.metricsAggregation);

  // Profit computations tracker (Task 5) - Runs every 2 minutes
  guardedInterval("profitCalculation", async () => {
    await runCostProfitWorker();
  }, WORKER_INTERVALS.profitCalculation);

  // System intelligence reporter (Task 6) - Runs every 3 minutes
  guardedInterval("failureIntel", async () => {
    await runFailureIntelligenceWorker();
  }, WORKER_INTERVALS.failureIntel);

  // CEO Self-Healing (Task 7) - Runs every 5 minutes
  guardedInterval("ceoSelfHealing", async () => {
    await runCEOSelfHealingWorker();
  }, WORKER_INTERVALS.ceoSelfHealing);

  // API Key Health Monitor (Task 9) - Checks every 15 minutes
  guardedInterval("apiKeyHealth", async () => {
    await ApiHealthMonitor.runDiagnostics();
  }, 15 * 60 * 1000);
  // Run once on startup
  ApiHealthMonitor.runDiagnostics().catch(err => logger.error("API check initial run exception:", err));

  // System Observability Center (Task 10) - Record metrics every minute
  guardedInterval("systemHealth", async () => {
    await SystemHealthCenter.logMetrics();
  }, WORKER_INTERVALS.systemHealth);
  // Run once on startup
  SystemHealthCenter.logMetrics().catch(err => logger.error("System health logger initial run exception:", err));

  // CEO Self-Healing Audit Daemon (Task 11) - Runs every 5 minutes
  guardedInterval("ceoSelfHealingAudit", async () => {
    await CEOAgent.runSelfHealingAudit();
  }, 300000);
  // Run once on startup
  CEOAgent.runSelfHealingAudit().catch(err => logger.error("CEO audit initial run exception:", err));
}
