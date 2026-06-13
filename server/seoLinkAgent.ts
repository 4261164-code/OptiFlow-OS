import { logger } from "./lib/logger";
import { db } from "./firebaseAdmin";
import { runSEOLinkAgent } from "./agents";

export interface SEOLinkAgentOpts {
  articleId: string;
  userId: string;
}

export async function runSEOLinkAgentPipeline(opts: SEOLinkAgentOpts): Promise<{
  success: boolean;
  optimizedContent: string;
  articleTitle: string;
  linksAddedCount: number;
}> {
  const { articleId, userId } = opts;

  if (!articleId) {
    throw new Error("Missing articleId in pipeline parameters");
  }
  if (!userId) {
    throw new Error("Missing userId in pipeline parameters");
  }

  logger.info(`[SEOLinkAgent Pipeline] Running link optimization for article: ${articleId}, user: ${userId}`);

  // Fetch article from Firestore
  const articleDoc = await db.collection("articles").doc(articleId).get();
  if (!articleDoc.exists) {
    throw new Error(`Article with ID ${articleId} not found in Firestore.`);
  }

  const articleData = articleDoc.data();
  if (!articleData) {
    throw new Error(`Article data for ID ${articleId} is empty.`);
  }

  // Security authorization gate
  if (articleData.userId !== userId) {
    throw new Error(`Unauthorized access: Article does not belong to the requested user.`);
  }

  const originalContent = articleData.content || "";
  const articleTitle = articleData.title || "";

  if (!originalContent.trim()) {
    throw new Error(`Article content is empty. Cannot optimize an empty article.`);
  }

  // Retrieve active affiliate/internal offers from the 'offers' collection for this user
  const offersQuery = await db.collection("offers").where("userId", "==", userId).get();
  
  const offers: any[] = [];
  offersQuery.forEach((doc) => {
    offers.push({
      id: doc.id,
      ...doc.data()
    });
  });

  if (offers.length === 0) {
    throw new Error(`No offers found in your index. Please add offers under the 'Affiliate Offers' tab first.`);
  }

  logger.info(`[SEOLinkAgent Pipeline] Retrieved ${offers.length} active offers for matching.`);

  // Pass generated article and active offers to the Gemini scanning model
  const optimizedContent = await runSEOLinkAgent(originalContent, offers);

  // Directly update firestore article content atomically inside the "Cloud Function" representation
  await db.collection("articles").doc(articleId).update({
    content: optimizedContent,
    updatedAt: Date.now()
  });

  logger.info(`[SEOLinkAgent Pipeline] Updated article '${articleId}' content successfully inside Firestore.`);

  // Simple metric estimation for feedback
  const originalLinkCount = (originalContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  const optimizedLinkCount = (optimizedContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  const linksAddedCount = Math.max(0, optimizedLinkCount - originalLinkCount);

  return {
    success: true,
    optimizedContent,
    articleTitle,
    linksAddedCount
  };
}
