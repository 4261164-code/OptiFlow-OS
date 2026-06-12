import { db } from "../firebaseAdmin";

/**
 * Contextual Multi-Armed Bandits (CMAB) System using Thompson Sampling
 * 
 * Replaces Q-learning with a production-grade selection algorithm commonly
 * used in ad-tech networks. Modulates Beta distribution per context.
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

// Memory cache for Beta distributions to save DB reads (in real prod, this is Redis/Memcached)
const contextBetaCache = new Map<string, BanditOfferArm[]>();

// Simple function to generate beta distribution sample using an approximation
function sampleBeta(alpha: number, beta: number): number {
  // Simple Beta distribution generator using uniform randoms
  let sumX = 0;
  for (let i = 0; i < alpha; i++) sumX += -Math.log(1 - Math.random());
  
  let sumY = 0;
  for (let i = 0; i < beta; i++) sumY += -Math.log(1 - Math.random());
  
  return sumX / (sumX + sumY);
}

export class BanditEngine {
  /**
   * Generates a unique context key (hash/string)
   */
  private static getContextKey(context: TrafficContext): string {
    return `${context.geo}_${context.device}_${context.trafficSource}_${context.timeOfDay}`;
  }

  /**
   * Fetch Beta distribution parameters for all available arms (offers)
   */
  private static async getArmsData(userId: string, contextKey: string, availableOffers: string[]): Promise<BanditOfferArm[]> {
    const cacheKey = `${userId}_${contextKey}`;
    if (contextBetaCache.has(cacheKey)) {
      return contextBetaCache.get(cacheKey)!;
    }

    const arms: BanditOfferArm[] = [];
    const banditRef = db.collection(`users/${userId}/bandit_models`);
    const doc = await banditRef.doc(contextKey).get();
    
    let dbArms: Record<string, { alpha: number, beta: number, payout: number }> = {};
    if (doc.exists) {
      dbArms = doc.data()?.arms || {};
    }

    for (const offerId of availableOffers) {
      // Default to 1, 1 for uninitialized arms (uniform prior)
      if (dbArms[offerId]) {
        arms.push({ offerId, payout: dbArms[offerId].payout, alpha: dbArms[offerId].alpha, beta: dbArms[offerId].beta });
      } else {
        arms.push({ offerId, payout: 10, alpha: 1, beta: 1 }); // Assume $10 payout as fallback
      }
    }

    // Cache to prevent firestore read burst
    contextBetaCache.set(cacheKey, arms);
    return arms;
  }

  /**
   * Core Selection Algorithm
   */
  static async selectOffer(userId: string, context: TrafficContext, availableOffers: string[]): Promise<string> {
    const contextKey = this.getContextKey(context);
    const arms = await this.getArmsData(userId, contextKey, availableOffers);

    let bestOffer = availableOffers[0] || "";
    let maxExpectedRevenue = -1;

    for (const arm of arms) {
      // Sample conversion probability from Beta distribution
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
   * Reward Update System - call this upon conversion or failure
   */
  static async updateReward(userId: string, context: TrafficContext, offerId: string, payout: number, converted: boolean): Promise<void> {
    const contextKey = this.getContextKey(context);
    const cacheKey = `${userId}_${contextKey}`;
    
    // In-memory update
    const arms = contextBetaCache.get(cacheKey) || [];
    const arm = arms.find(a => a.offerId === offerId);
    if (arm) {
      if (converted) arm.alpha += 1;
      else arm.beta += 1;
      arm.payout = payout; // update to latest actual payout
    } else if (converted) {
      arms.push({ offerId, alpha: 2, beta: 1, payout });
    } else {
      arms.push({ offerId, alpha: 1, beta: 2, payout });
    }
    contextBetaCache.set(cacheKey, arms);

    // Persist to DB asynchronously
    const docRef = db.collection(`users/${userId}/bandit_models`).doc(contextKey);
    // Format for firestore doc structure
    const dbData: Record<string, any> = {};
    arms.forEach(a => {
      dbData[a.offerId] = { alpha: a.alpha, beta: a.beta, payout: a.payout };
    });

    await docRef.set({
      contextKey,
      updatedAt: Date.now(),
      arms: dbData
    }, { merge: true }).catch(err => {
      console.error("[BanditEngine] Error persisting bandit model reward", err);
    });
  }
}
