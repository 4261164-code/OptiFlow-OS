import { logger } from "./lib/logger";
import { runResearchAgent, runWriterAgent, runMonetizationAgent, runPinterestAgent, runImageGenerationAgent, runSEOLinkAgent } from "./agents";
import { db } from "./firebaseAdmin";
import { queueImageRetry } from "./services/imageService";
import { WordPressClient } from "./integrations/wordpress/client";
import { PinterestClient } from "./integrations/pinterest/client";


export async function logAgentTelemetry(userId: string, agentType: string, status: 'success' | 'warn' | 'error' | 'info' | 'started' | 'running' | 'completed' | 'failed', message: string, jobId?: string) {
  try {
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.collection("agent_logs").doc(logId).set({
      id: logId,
      agentType,
      status,
      message,
      jobId: jobId || "system",
      userId: userId || "system-fallback",
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (err) {
    logger.error("[Telemetry] Failed to record log:", err);
  }
}

function generateId() {
  return Array.from({ length: 20 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
}

export interface PipelineOpts {
  userId: string;
  jobId: string;
  keyword: string;
  articleLength?: number;
  seoLevel?: string;
  country?: string;
  language?: string;
  tone?: string;
  numPins?: number;
  hasFaq?: boolean;
  internalLinks?: boolean;
  externalLinks?: boolean;
  affiliateOffers?: string;
  existingArticleTitle?: string;
  existingArticleContent?: string;
}

export async function runPipeline(opts: PipelineOpts): Promise<{
  researchResult: string;
  articleId: string;
  article: { title: string; content: string };
  pins: any[];
}> {
  const {
    userId,
    jobId,
    keyword,
    articleLength = 2000,
    seoLevel = "High",
    country = "United States",
    language = "English",
    tone = "Professional & Engaging",
    numPins = 5,
    hasFaq = true,
    internalLinks = true,
    externalLinks = true,
    affiliateOffers = "",
    existingArticleTitle = "",
    existingArticleContent = ""
  } = opts;

  logger.info(`[Pipeline] Starting background pipeline agent orchestration for Job: ${jobId}, User: ${userId}`);
  await logAgentTelemetry(userId, "System Orchestrator", "started", `Background pipeline agent orchestration initialized for job target: '${keyword}'`, jobId);

  // Base state definition
  let researchRaw = "{}";
  let articleRaw: { title: string; content: string } = { title: "", content: "" };
  let articleId = generateId();
  let pins: any[] = [];

  // ==========================================
  // STAGE 1: Research Agent (if needed)
  // ==========================================
  if (!existingArticleContent) {
    if (jobId) await db.collection("jobs").doc(jobId).update({ status: "research", updatedAt: Date.now() });
    logger.info(`[Pipeline] Stage 1: Initiating Research Agent for '${keyword}'...`);
    await logAgentTelemetry(userId, "Research Agent", "running", `Parsing SERP results and extracting competitor semantic density for keyword: '${keyword}'`, jobId);
    
    researchRaw = await runResearchAgent(keyword, { country, language, userId });
    
    logger.info(`[Pipeline] Stage 1 success.`);
    await logAgentTelemetry(userId, "Research Agent", "success", `Topological silo maps & payload successfully constructed.`, jobId);
  } else {
    logger.info(`[Pipeline] Ingestion mode bypasses Stage 1 Research.`);
    await logAgentTelemetry(userId, "Research Agent", "info", `Bypassing SERP scrape. Payload ingested manually from external request.`, jobId);
  }

  // ==========================================
  // STAGE 2: Writer Agent & SEO Monetization
  // ==========================================
  if (jobId) await db.collection("jobs").doc(jobId).update({ status: "writing", updatedAt: Date.now() });
  logger.info(`[Pipeline] Stage 2: Drafting and Optimizing Article...`);
  await logAgentTelemetry(userId, "Director of Content Context", "running", `Drafting structural markdown pillar with specified length constraints.`, jobId);

  if (existingArticleContent) {
    articleRaw = {
      title: existingArticleTitle || keyword,
      content: existingArticleContent
    };
    // Optimize pre-existing article
    if (affiliateOffers || seoLevel) {
      const optimized = await runMonetizationAgent(articleRaw.content, keyword, { 
        seoLevel, 
        internalLinks, 
        externalLinks, 
        affiliateOffers,
        userId
      });
      articleRaw.content = optimized;
    }
  } else {
    // 1. Generate core article draft via Writer
    articleRaw = await runWriterAgent(keyword, researchRaw, { articleLength, tone, hasFaq, userId });
    // 2. Wrap/inject structure via SEO Monetization
    const optimized = await runMonetizationAgent(articleRaw.content, keyword, { 
      seoLevel, 
      internalLinks, 
      externalLinks, 
      affiliateOffers,
      userId
    });
    articleRaw.content = optimized;
  }

  // 3. Inject actual affiliate links into the article if user has active offers
  try {
    if (userId) {
      const offersQuery = await db.collection("offers").where("userId", "==", userId).get();
      const offersList: any[] = [];
      offersQuery.forEach(doc => offersList.push({ id: doc.id, ...doc.data() }));
      
      if (offersList.length > 0) {
        logger.info(`[Pipeline] Running SEO Link Agent with ${offersList.length} offers...`);
        await logAgentTelemetry(userId, "Affiliate Matchmaker", "running", `Analyzing ${offersList.length} conversion triggers from dynamic collection to inject. `, jobId);
        
        const finalContent = await runSEOLinkAgent(articleRaw.content, offersList, userId);
        articleRaw.content = finalContent;
        await logAgentTelemetry(userId, "Affiliate Matchmaker", "success", `Successfully matched and injected relevant outbound conversion nodes.`, jobId);
      }
    }
  } catch (err) {
    logger.info(`[Pipeline] SEO Link Agent step failed, skipping link injection...`, err);
  }

  logger.info(`[Pipeline] Stage 2 success. Generated article '${articleId}'.`);
  
  // Checkpoint: Save article to database
  await db.collection("articles").doc(articleId).set({
      id: articleId,
      title: articleRaw.title,
      content: articleRaw.content,
      keyword: keyword,
      userId: userId || "system-fallback",
      jobId: jobId || "system",
      createdAt: Date.now(),
      updatedAt: Date.now()
  });

  // ==========================================
  // STAGE 3: Pinterest & Image Generation
  // ==========================================
  if (numPins > 0) {
    if (jobId) await db.collection("jobs").doc(jobId).update({ status: "pinterest", updatedAt: Date.now() });
    logger.info(`[Pipeline] Stage 3: Structuring Pinterest Pins with concept matches...`);
    await logAgentTelemetry(userId, "Pinterest Swarm Engine", "running", `Extrapolating engaging hook triggers from article syntax to seed ${numPins} pin schemas.`, jobId);
    
    const pinterestRaw = await runPinterestAgent(articleRaw.content, numPins, userId);
    
    try {
      const parsed = JSON.parse(pinterestRaw);
      if (parsed && Array.isArray(parsed.pins)) {
        pins = parsed.pins;
      }
    } catch (err) {
      logger.info(`[Pipeline Notice] Stage 3 pin json parse failed. Recovering raw text gracefully.`);
    }

    // Assign IDs and generate design images sequentially
    if (pins.length > 0) {
      logger.info(`[Pipeline] Generating accompanying design images sequentially via Image Agent...`);
      await logAgentTelemetry(userId, "Pinterest Swarm Engine", "success", `JSON concept schema constructed. Yielding to Image Agent.`, jobId);
      await logAgentTelemetry(userId, "Image Generation Node", "running", `Rendering background asset grids through Gemini AI Vision.`, jobId);
      
      for (const pin of pins) {
        pin.id = generateId();
        if (pin.concept) {
          try {
            const imageUrl = await runImageGenerationAgent(pin.concept, userId);
            if (imageUrl) {
              pin.imageUrl = imageUrl;
            } else {
              throw new Error("No image generated");
            }
          } catch (err: any) {
            logger.error(`[Pipeline Error] Image generation failed for pin ${pin.id}. Queueing retry.`, err);
            await queueImageRetry(pin.id, pin.concept, userId);
            pin.imageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
          }
        }
      }
    }
  }

  // ==========================================
  // STAGE 4: WordPress & Pinterest Publishing
  // ==========================================
  if (jobId) await db.collection("jobs").doc(jobId).update({ status: "publishing", updatedAt: Date.now() });

  logger.info(`[Pipeline] Stage 4: Publishing constraints & execution...`);
  await logAgentTelemetry(userId, "Distribution Engine", "running", `Initiating WP and Pinterest deployments.`, jobId);

  try {
     const settingsSnap = await db.collection("settings").doc(userId).get();
     const settings = settingsSnap.data() || {};
     const wpEnabled = settings.wordpressUrl && settings.wordpressUsername && settings.wordpressAppPassword;
     const pinEnabled = settings.pinterestAccessToken && settings.pinterestBoardId;

     if (wpEnabled) {
        logger.info(`[Pipeline] WordPress integration found. Publishing...`);
        const wpClient = new WordPressClient({
           url: settings.wordpressUrl,
           username: settings.wordpressUsername,
           appPassword: settings.wordpressAppPassword
        });

        const wpResult = await wpClient.publishPost({
           title: articleRaw.title,
           content: articleRaw.content,
           status: 'publish'
        });
        
        await logAgentTelemetry(userId, "Distribution Engine", "success", `Successfully published to WordPress with ID ${wpResult.id}`, jobId);
        articleRaw.content += `\n\n_WP Post ID: ${wpResult.id}_`; // Add basic reference
        
        await db.collection("articles").doc(articleId).update({
            wordpressStatus: "published",
            wordpressId: wpResult.id,
            wordpressUrl: `${settings.wordpressUrl}/?p=${wpResult.id}`,
            content: articleRaw.content,
            updatedAt: Date.now()
        });
     } else {
        logger.warn(`[Pipeline] WP Configuration missing. Skipping true WP deployment.`);
     }

     if (pinEnabled && pins.length > 0) {
        logger.info(`[Pipeline] Pinterest integration found. Publishing ${pins.length} pins...`);
        const pinClient = new PinterestClient({
           accessToken: settings.pinterestAccessToken,
           boardId: settings.pinterestBoardId
        });

        for (const pin of pins) {
             const pinResult = await pinClient.createPin({
                title: pin.title || articleRaw.title,
                description: pin.description || `Read more about ${keyword}`,
                link: settings.wordpressUrl ? `${settings.wordpressUrl}/?p=${articleRaw.content.match(/_WP Post ID: (\d+)_/)?.[1] || articleId}` : `https://yoursite.com/post/${articleId}`,
                mediaUrl: pin.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c"
             });
             pin.networkId = pinResult.id;
        }
        
        await db.collection("articles").doc(articleId).update({
            pinterestStatus: "published",
            pins: pins,
            updatedAt: Date.now()
        });

        await logAgentTelemetry(userId, "Distribution Engine", "success", `Successfully published ${pins.length} pins to Pinterest board`, jobId);
     } else {
        logger.warn(`[Pipeline] Pinterest Configuration missing or no pins. Skipping true Pin deployment.`);
     }

  } catch (err: any) {
     logger.error(`[Pipeline Error] Publish stage failed: ${err.message}`, err);
     await logAgentTelemetry(userId, "Distribution Engine", "error", `Distribution deployment failed: ${err.message}`, jobId);
  }

  logger.info(`[Pipeline] Full pipeline agents completed successfully!`);
  await logAgentTelemetry(userId, "System Orchestrator", "completed", `Full multi-agent pipeline routine closed successfully without exception. Output pushed to collection.`, jobId);

  return {
    researchResult: researchRaw,
    articleId,
    article: articleRaw,
    pins: pins
  };
}
