import { db } from "../../firebaseAdmin";
import { logger } from "../../lib/logger";

// Offer Intelligence Engine (EPC Swapping)
export async function optimizeOffers() {
  try {
    const offersSnap = await db.collection("offers").get();
    
    if (offersSnap.empty) {
        logger.info("[Offer Intelligence] No offers available to optimize.");
        return;
    }

    const offers: any[] = [];
    offersSnap.forEach(doc => {
       offers.push({ id: doc.id, ...doc.data() });
    });

    // Calculate real-time EPC from conversions
    const conversionsSnap = await db.collection("conversions").get();
    let conversions = [];
    conversionsSnap.forEach(doc => conversions.push(doc.data()));

    const clicksSnap = await db.collection("clicks").get();
    let clicks = [];
    clicksSnap.forEach(doc => clicks.push(doc.data()));

    for (let offer of offers) {
       const offerClicks = clicks.filter(c => c.offer_id === offer.id);
       const offerConversions = conversions.filter(c => {
           // match conversion to click to offer
           const click = offerClicks.find(oc => oc.click_id === c.click_id);
           return !!click;
       });

       const totalClicks = offerClicks.length;
       const totalRevenue = offerConversions.reduce((sum, conv) => sum + (conv.revenue || 0), 0);
       
       const calculatedEpc = totalClicks > 0 ? (totalRevenue / totalClicks) : 0;
       
       // Update the offer with its new EPC
       await db.collection("offers").doc(offer.id).update({ epc: calculatedEpc });
       offer.epc = calculatedEpc;
    }

    // Sort offers by EPC descending
    const sorted = offers.sort((a, b) => (b.epc || 0) - (a.epc || 0));
    const bestOffer = sorted[0];

    // Set active best offer
    await db.collection("system").doc("activeOffer").set({
      offerId: bestOffer.id,
      name: bestOffer.name,
      epc: bestOffer.epc,
      updated_at: Date.now()
    });

    logger.info(`[Offer Intelligence] Swapped active offer to ${bestOffer.id} (EPC: ${bestOffer.epc})`);

  } catch (error: any) {
    logger.error(`[Offer Intelligence] Error optimizing offers: ${error.message}`);
  }
}
