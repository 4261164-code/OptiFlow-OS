import { db } from "../../firebaseAdmin";
import { logger } from "../../lib/logger";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function dailyBrain() {
  try {
     logger.info("[Daily Brain] Initiating multi-agent feedback loop analysis...");
     const data = await getSystemMetrics();

     const prompt = `
     You are a growth engine.
     Analyze performance and suggest actions. Return ONLY valid JSON in this format:
     { "actions": [ { "type": "content|seo|distribute", "payload": { "target": "article_id_or_keyword" } } ] }
     Revenue: $${data.revenue}
     Top Content: ${data.topContent}
     Low Content: ${data.lowContent}
     Active Offer: ${data.offers}
     `;

     let decisions: any = { actions: [] };

     if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy') {
         logger.error("[Daily Brain] GEMINI_API_KEY missing. Skipping decision cycle.");
         return;
     }

     const response = await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: [
             { role: "user", parts: [{ text: "You are an automated growth system. Output structured JSON only.\n" + prompt }] }
         ],
         config: {
             responseMimeType: "application/json",
             responseSchema: {
                 type: Type.OBJECT,
                 properties: {
                     actions: {
                         type: Type.ARRAY,
                         items: {
                             type: Type.OBJECT,
                             properties: {
                                 type: { type: Type.STRING },
                                 payload: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        target: { type: Type.STRING }
                                    }
                                 }
                             },
                             required: ["type", "payload"]
                         }
                     }
                 },
                 required: ["actions"]
             }
         }
     });
     try {
         decisions = JSON.parse(response.text || '{"actions":[]}');
     } catch(e) {
         logger.error("[Daily Brain] Failed to parse JSON from AI.");
     }
     
     for (const action of decisions.actions) {
         await db.collection("jobs").add({
             type: action.type,
             status: "pending",
             payload: action.payload,
             retry_count: 0,
             created_at: Date.now()
         });
         logger.info(`[Daily Brain] Queued strategic job: ${action.type} for ${JSON.stringify(action.payload)}`);
     }
  } catch (error: any) {
      if (error.message && error.message.includes("429")) {
          logger.warn(`[Daily Brain] Rate limit exceeded. Skipping this cycle. (${error.message})`);
      } else {
          logger.error(`[Daily Brain] Engine failure: ${error.message}`);
      }
  }
}

async function getSystemMetrics() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentConversions = await db.collection("conversions")
      .where("timestamp", ">=", thirtyDaysAgo)
      .limit(1000)
      .get();
    
    let totalRevenue = 0;
    recentConversions.forEach(doc => totalRevenue += (doc.data().revenue || doc.data().amount || 0));

    const topContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "desc")
      .limit(1)
      .get();
    const topContent = topContentSnap.empty ? "none" : topContentSnap.docs[0].data().articleId || topContentSnap.docs[0].id;

    const lowContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "asc")
      .limit(1)
      .get();
    const lowContent = lowContentSnap.empty ? "none" : lowContentSnap.docs[0].data().articleId || lowContentSnap.docs[0].id;

    const systemDoc = await db.collection("system").doc("activeOffer").get();
    const activeOffer = systemDoc.exists ? systemDoc.data()?.name || "none" : "none";

    return {
        revenue: totalRevenue,
        topContent: topContent,
        lowContent: lowContent,
        offers: activeOffer
    };
}
