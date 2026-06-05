import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * SEOLinkAgent - Fetches an article from Firestore, queries matching customer affiliate links,
 * runs natural keyword injection, models optimized anchors, and writes changes directly back.
 */
export const seoLinkAgent = functions.https.onCall(async (data, context) => {
  // Enforce secure user context matching
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated with Firebase Authentication."
    );
  }

  const userId = context.auth.uid;
  const { articleId } = data;

  if (!articleId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'articleId'."
    );
  }

  // 1. Fetch target article from Firestore
  const articleDoc = await db.collection("articles").doc(articleId).get();
  if (!articleDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      `Article with ID '${articleId}' was not found in database.`
    );
  }

  const articleData = articleDoc.data();
  if (!articleData) {
    throw new functions.https.HttpsError(
      "internal",
      "Target article data is empty."
    );
  }

  // Identity and access control validation
  if (articleData.userId !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Access Denied: You do not have permissions to optimize this article."
    );
  }

  const articleContent = articleData.content || "";

  // 2. Fetch configured affiliate/internal offers from 'offers' collection for user
  const offersQuery = await db.collection("offers").where("userId", "==", userId).get();
  const offersList: any[] = [];
  
  offersQuery.forEach((doc) => {
    offersList.push({
      id: doc.id,
      ...doc.data()
    });
  });

  if (offersList.length === 0) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "No offers found in your index. Please register offers in your Affiliate Offers collection first."
    );
  }

  // 3. Obtain secret Gemini API config
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "GEMINI_API_KEY environment variable is not configured."
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const offersListJson = JSON.stringify(offersList, null, 2);

  // Formulate optimization rules
  const prompt = `You are an elite SEO and monetization agent (SEOLinkAgent).
You have been given a blog post written in Markdown and a JSON list of available offers (with brand, keyword/topic triggers, affiliate URLs, and visual suggestions).

Available Offers Index:
${offersListJson}

Your ultimate goal is to:
1. Thoroughly parse the markdown article body.
2. Identify strategic opportunities (words, phrases, or semantic contexts) to naturally pitch/insert these offers.
3. Replace those instances with natural high-converting markdown links inside the flow of sentences. E.g., "[Keyword trigger words](Offer Link URL)" or a helpful suggestion box.
4. Integrate the links natively within the text structure. For example, instead of just appending raw links, weave them into existing relevant sentences.
5. Apply optimization constraints:
   - Insert between 2 to 5 links depending on article length.
   - Never insert the exact same offer/link more than twice.
   - Do NOT break any markdown table, heading, image, or list formatting.
   - Keep the original tone and flow intact.

Return ONLY the fully embellished, hyperlinked Markdown body. Do not include any greeting, introduction, system metadata, or markdown block wrapping \`\`\`markdown. Go directly to the optimized contents.

Original Markdown Content:
${articleContent}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      temperature: 0.5
    }
  });

  const optimizedContent = response.text
    ? response.text.replace(/```markdown\n/g, '').replace(/```/g, '').trim()
    : articleContent;

  // 4. Atomically persist changes
  await db.collection("articles").doc(articleId).update({
    content: optimizedContent,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    success: true,
    message: "SEO links contextually injected successfully.",
    optimizedContent
  };
});
