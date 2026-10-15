import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";

/**
 * Contextual Multi-Armed Bandits (CMAB) System using Thompson Sampling & Epsilon Exploration
 * 
 * Production-grade selection algorithm used in high-frequency ad-tech networks.
 * Uses O(1) Gamma-based Beta distribution sampling with empirical Bayes prior smoothing
 * to prevent small-sample distortion and infinite exploration lockouts.
 */

export interface TrafficContext {
  geo: string;
  device: string;
  trafficSource: string;
  timeOfDay: string; // e.g., 'morning', 'afternoon'
}

export interface BanditOfferArm {
  offerId: string;
  payout: number;
  alpha: number; // successes + 1
  beta: number;  // failures + 1
}

// Memory cache for Beta distributions to save DB reads (Redis/Memory fallback)
const contextBetaCache = new Map<string, BanditOfferArm[]>();

/**
 * O(1) Marsaglia-Tsang Gamma random generator
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / Math.max(shape, 0.001));
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let u1 = Math.random();
    let u2 = Math.random();
    // Box-Muller for standard normal
    let z = Math.sqrt(-2.0 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2.0 * Math.PI * u2);
    let v = 1 + c * z;
    if (v <= 0) continue;
    v = v * v * v;
    let u = Math.random();
    if (u < 1 - 0.0331 * z * z * z * z) return d * v;
    if (Math.log(Math.max(u, 1e-10)) < 0.5 * z * z + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * O(1) Beta distribution generator using ratio of Gamma variates
 */
export function sampleBeta(alpha: number, beta: number): number {
  const safeAlpha = Math.max(0.1, alpha);
  const safeBeta = Math.max(0.1, beta);
  const x = sampleGamma(safeAlpha);
  const y = sampleGamma(safeBeta);
  if (x + y <= 0) return 0.5;
  return x / (x + y);
}

export class BanditEngine {
  /**
   * Generates a unique context key (hash/string)
   */
  static getContextKey(context: TrafficContext): string {
    const geo = (context.geo || "US").toUpperCase();
    const device = (context.device || "desktop").toLowerCase();
    const source = (context.trafficSource || "direct").toLowerCase();
    const time = context.timeOfDay || "day";
    return `${geo}_${device}_${source}_${time}`;
  }

  /**
   * Fetch Beta distribution parameters for all available arms (offers)
   */
  private static async getArmsData(
    userId: string, 
    contextKey: string, 
    availableOffers: string[], 
    defaultPayouts: Record<string, number> = {}
  ): Promise<BanditOfferArm[]> {
    const cacheKey = `${userId}_${contextKey}`;
    if (contextBetaCache.has(cacheKey)) {
      return contextBetaCache.get(cacheKey)!;
    }

    const arms: BanditOfferArm[] = [];
    const banditRef = db.collection(`users/${userId}/bandit_models`);
    let doc: any = null;
    try {
      doc = await banditRef.doc(contextKey).get();
    } catch (err) {
      // Graceful fallback to uninitialized priors
    }
    
    let dbArms: Record<string, { alpha: number, beta: number, payout: number }> = {};
    if (doc && doc.exists) {
      dbArms = doc.data()?.arms || {};
    }

    for (const offerId of availableOffers) {
      // Default to alpha=2, beta=18 (10% prior conversion rate with modest strength)
      // to avoid small sample spikes where 1 conversion / 1 click yields 100% CTR
      if (dbArms[offerId]) {
        arms.push({ 
          offerId, 
          payout: dbArms[offerId].payout || defaultPayouts[offerId] || 10, 
          alpha: Math.max(1, dbArms[offerId].alpha), 
          beta: Math.max(1, dbArms[offerId].beta) 
        });
      } else {
        arms.push({ 
          offerId, 
          payout: defaultPayouts[offerId] || 10, 
          alpha: 2, 
          beta: 18 
        });
      }
    }

    contextBetaCache.set(cacheKey, arms);
    return arms;
  }

  /**
   * Core Selection Algorithm: 90% Thompson Sampling (Exploit/Optimal Expected Revenue),
   * 10% Epsilon Exploration (Challenger testing)
   */
  static async selectOffer(userId: string, context: TrafficContext, availableOffers: string[]): Promise<string> {
    if (!availableOffers || availableOffers.length === 0) {
      return "";
    }
    if (availableOffers.length === 1) {
      return availableOffers[0];
    }

    // 10% Epsilon Exploration: pick a random alternative offer to guarantee continuous discovery
    if (Math.random() < 0.10) {
      const randomIndex = Math.floor(Math.random() * availableOffers.length);
      return availableOffers[randomIndex];
    }

    const defaultPayouts: Record<string, number> = {};
    try {
      const offersSnap = await db.collection("offers").where("__name__", "in", availableOffers.slice(0, 30)).get();
      offersSnap.forEach(doc => defaultPayouts[doc.id] = doc.data().payout || 10);
    } catch (e) {
      // Continue with default payouts
    }

    const contextKey = this.getContextKey(context);
    const arms = await this.getArmsData(userId, contextKey, availableOffers, defaultPayouts);

    let bestOffer = availableOffers[0];
    let maxExpectedRevenue = -1;

    for (const arm of arms) {
      // Sample conversion probability from Beta distribution in O(1)
      const pConv = sampleBeta(arm.alpha, arm.beta);
      // Expected Revenue = P(convert) * payout
      const expectedRevenue = pConv * arm.payout;

      if (expectedRevenue > maxExpectedRevenue) {
        maxExpectedRevenue = expectedRevenue;
        bestOffer = arm.offerId;
      }
    }

    return bestOffer;
  }

  /**
   * Reward Update System - updates Bayesian Beta priors upon conversion or click
   */
  static async updateReward(
    userId: string, 
    context: TrafficContext, 
    offerId: string, 
    payout: number, 
    converted: boolean
  ): Promise<void> {
    const contextKey = this.getContextKey(context);
    const cacheKey = `${userId}_${contextKey}`;
    
    // In-memory update
    const arms = contextBetaCache.get(cacheKey) || [];
    const arm = arms.find(a => a.offerId === offerId);
    if (arm) {
      if (converted) arm.alpha += 1;
      else arm.beta += 1;
      if (payout > 0) arm.payout = payout;
    } else if (converted) {
      arms.push({ offerId, alpha: 3, beta: 18, payout: payout || 10 });
    } else {
      arms.push({ offerId, alpha: 2, beta: 19, payout: payout || 10 });
    }
    contextBetaCache.set(cacheKey, arms);

    // Persist to DB asynchronously
    try {
      const docRef = db.collection(`users/${userId}/bandit_models`).doc(contextKey);
      const dbData: Record<string, any> = {};
      arms.forEach(a => {
        dbData[a.offerId] = { alpha: a.alpha, beta: a.beta, payout: a.payout };
      });

      await docRef.set({
        contextKey,
        updatedAt: Date.now(),
        arms: dbData
      }, { merge: true });
    } catch (err: any) {
      logger.error("[BanditEngine] Error persisting bandit model reward", err.message);
    }
  }
}
