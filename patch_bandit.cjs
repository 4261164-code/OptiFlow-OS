const fs = require('fs');
let code = fs.readFileSync('server/services/banditEngine.ts', 'utf8');

// Replace getArmsData to take offer details
code = code.replace(
  `  private static async getArmsData(userId: string, contextKey: string, availableOffers: string[]): Promise<BanditOfferArm[]> {`,
  `  private static async getArmsData(userId: string, contextKey: string, availableOffers: string[]): Promise<BanditOfferArm[]> {`
);

// We need to fetch offer base payouts, but wait, availableOffers is just string[].
// Let's modify selectOffer to fetch offers from DB if available.
code = code.replace(
  `  static async selectOffer(userId: string, context: TrafficContext, availableOffers: string[]): Promise<string> {`,
  `  static async selectOffer(userId: string, context: TrafficContext, availableOffers: string[]): Promise<string> {
    const defaultPayouts: Record<string, number> = {};
    const offersSnap = await db.collection("offers").where("__name__", "in", availableOffers).get();
    offersSnap.forEach(doc => defaultPayouts[doc.id] = doc.data().payout || 10);
`
);

code = code.replace(
  `      if (dbArms[offerId]) {
        arms.push({ offerId, payout: dbArms[offerId].payout, alpha: dbArms[offerId].alpha, beta: dbArms[offerId].beta });
      } else {
        arms.push({ offerId, payout: 10, alpha: 1, beta: 1 }); // Assume $10 payout as fallback
      }`,
  `      if (dbArms[offerId]) {
        arms.push({ offerId, payout: dbArms[offerId].payout, alpha: dbArms[offerId].alpha, beta: dbArms[offerId].beta });
      } else {
        arms.push({ offerId, payout: (defaultPayouts && defaultPayouts[offerId]) ? defaultPayouts[offerId] : 10, alpha: 1, beta: 1 });
      }`
);

// Fix updateReward
code = code.replace(
  `  static async updateReward(userId: string, context: TrafficContext, offerId: string, payout: number, converted: boolean): Promise<void> {
    const contextKey = this.getContextKey(context);
    const cacheKey = \`\${userId}_\${contextKey}\`;
    
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
    const docRef = db.collection(\`users/\${userId}/bandit_models\`).doc(contextKey);
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
      logger.error("[BanditEngine] Error persisting bandit model reward", err);
    });
  }`,
  `  static async updateReward(userId: string, context: TrafficContext, offerId: string, payout: number, converted: boolean): Promise<void> {
    const contextKey = this.getContextKey(context);
    const docRef = db.collection(\`users/\${userId}/bandit_models\`).doc(contextKey);
    
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      let armsData: Record<string, any> = snap.exists ? (snap.data()?.arms || {}) : {};
      
      let arm = armsData[offerId];
      if (!arm) {
        arm = { alpha: 1, beta: 1, payout, conversions: 0 };
      }
      
      if (converted) {
        arm.alpha += 1;
        arm.conversions = (arm.conversions || 0) + 1;
        // Running average payout
        arm.payout = arm.conversions === 1 ? payout : ((arm.payout * (arm.conversions - 1)) + payout) / arm.conversions;
      } else {
        arm.beta += 1;
      }
      
      armsData[offerId] = arm;
      
      tx.set(docRef, {
        contextKey,
        updatedAt: Date.now(),
        arms: armsData
      }, { merge: true });
    }).catch(err => {
      logger.error("[BanditEngine] Error persisting bandit model reward transaction", err);
    });
    
    // Invalidate cache
    contextBetaCache.delete(\`\${userId}_\${contextKey}\`);
  }`
);

// We need to pass defaultPayouts to getArmsData
code = code.replace(
  `const arms = await this.getArmsData(userId, contextKey, availableOffers);`,
  `const arms = await this.getArmsData(userId, contextKey, availableOffers, defaultPayouts);`
);

code = code.replace(
  `private static async getArmsData(userId: string, contextKey: string, availableOffers: string[]): Promise<BanditOfferArm[]> {`,
  `private static async getArmsData(userId: string, contextKey: string, availableOffers: string[], defaultPayouts: Record<string, number> = {}): Promise<BanditOfferArm[]> {`
);

fs.writeFileSync('server/services/banditEngine.ts', code);
