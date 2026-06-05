import { 
  runResearchAgent, 
  runWriterAgent, 
  runMonetizationAgent, 
  runPinterestAgent, 
  runImageGenerationAgent 
} from "./agents";

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

  console.log(`[Pipeline] Starting background pipeline agent orchestration for Job: ${jobId}, User: ${userId}`);

  // Base state definition
  let researchRaw = "{}";
  let articleRaw: { title: string; content: string } = { title: "", content: "" };
  let articleId = generateId();
  let pins: any[] = [];

  // ==========================================
  // STAGE 1: Research Agent (if needed)
  // ==========================================
  if (!existingArticleContent) {
    console.log(`[Pipeline] Stage 1: Initiating Research Agent for '${keyword}'...`);
    researchRaw = await runResearchAgent(keyword, { country, language });
    console.log(`[Pipeline] Stage 1 success.`);
  } else {
    console.log(`[Pipeline] Ingestion mode bypasses Stage 1 Research.`);
  }

  // ==========================================
  // STAGE 2: Writer Agent & SEO Monetization
  // ==========================================
  console.log(`[Pipeline] Stage 2: Drafting and Optimizing Article...`);

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
        affiliateOffers 
      });
      articleRaw.content = optimized;
    }
  } else {
    // 1. Generate core article draft via Writer
    articleRaw = await runWriterAgent(keyword, researchRaw, { articleLength, tone, hasFaq });
    // 2. Wrap/inject links via SEO Monetization
    const optimized = await runMonetizationAgent(articleRaw.content, keyword, { 
      seoLevel, 
      internalLinks, 
      externalLinks, 
      affiliateOffers 
    });
    articleRaw.content = optimized;
  }

  console.log(`[Pipeline] Stage 2 success. Generated article '${articleId}'.`);

  // ==========================================
  // STAGE 3: Pinterest & Image Generation
  // ==========================================
  if (numPins > 0) {
    console.log(`[Pipeline] Stage 3: Structuring Pinterest Pins with concept matches...`);
    const pinterestRaw = await runPinterestAgent(articleRaw.content, numPins);
    
    try {
      const parsed = JSON.parse(pinterestRaw);
      if (parsed && Array.isArray(parsed.pins)) {
        pins = parsed.pins;
      }
    } catch (err) {
      console.warn(`[Pipeline Notice] Stage 3 pin json parse failed. Recovering raw text gracefully.`);
    }

    // Assign IDs and generate design images sequentially
    if (pins.length > 0) {
      console.log(`[Pipeline] Generating accompanying design images sequentially via Image Agent...`);
      for (const pin of pins) {
        pin.id = generateId();
        if (pin.concept) {
          try {
            const imageUrl = await runImageGenerationAgent(pin.concept);
            if (imageUrl) {
              pin.imageUrl = imageUrl;
            }
          } catch (err) {
            console.log(`[Pipeline Notice] Image fallback selected for pin ${pin.id} concept: ${pin.concept}`);
          }
        }
      }
    }
  }

  console.log(`[Pipeline] Full pipeline agents completed successfully!`);

  return {
    researchResult: researchRaw,
    articleId,
    article: articleRaw,
    pins: pins
  };
}
