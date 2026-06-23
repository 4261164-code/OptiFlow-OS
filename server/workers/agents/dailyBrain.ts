import { db } from "../../firebaseAdmin";
import { logger } from "../../lib/logger";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

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

     if (process.env.OPENAI_API_KEY) {
         const response = await openai.chat.completions.create({
             model: "gpt-4.1-mini",
             messages: [
                 { role: "system", content: "You are an automated growth system. Output structured JSON only." },
                 { role: "user", content: prompt }
             ]
         });
         try {
             decisions = JSON.parse(response.choices[0].message.content || '{"actions":[]}');
         } catch(e) {
             logger.error("[Daily Brain] Failed to parse JSON from AI.");
         }
     } else {
         // Mock decision logic
         logger.info("[Daily Brain] Using mock decision engine (No OPENAI_API_KEY).");
         decisions = {
             actions: [
                 { type: "content", payload: { action: "clone_content", target: data.topContent } },
                 { type: "seo", payload: { action: "rewrite_title", target: data.lowContent } }
             ]
         };
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
      logger.error(`[Daily Brain] Engine failure: ${error.message}`);
  }
}

async function getSystemMetrics() {
    // Collect a quick snapshot of the DB state
    const conversionsSnap = await db.collection("conversions").get();
    let totalRevenue = 0;
    conversionsSnap.forEach(doc => totalRevenue += (doc.data().revenue || 0));

    // Simple mock logic to fetch top and low content
    const contentSnap = await db.collection("content").limit(2).get();
    let contents: any[] = [];
    contentSnap.forEach(doc => contents.push({ id: doc.id, ...doc.data() }));

    const topContent = contents[0]?.id || "none";
    const lowContent = contents[1]?.id || "none";

    const systemDoc = await db.collection("system").doc("activeOffer").get();
    const activeOffer = systemDoc.exists ? systemDoc.data()?.name || "none" : "none";

    return {
        revenue: totalRevenue,
        topContent: topContent,
        lowContent: lowContent,
        offers: activeOffer
    };
}
