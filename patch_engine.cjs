const fs = require('fs');
let code = fs.readFileSync('server/orchestrator/engine.ts', 'utf8');

// Add imports
code = code.replace(
  `import {
  runResearchAgent,`,
  `import { publishToWordPress } from "../integrations/wordpress";
import { publishToPinterest } from "../integrations/pinterest";
import {
  runResearchAgent,`
);

// MediaAgent
code = code.replace(
  `case "MediaAgent":
        return {
          media: [{ url: "https://via.placeholder.com/800", alt: targetId }],
        };`,
  `case "MediaAgent":
        const imageUrl = await runImageGenerationAgent(targetId, userId);
        if (!imageUrl) throw new Error("Image generation failed");
        return {
          media: [{ url: imageUrl, alt: targetId }],
        };`
);

// PublisherAgent
code = code.replace(
  `case "PublisherAgent":
        // Stub implementation
        logger.info(\`[PublisherAgent] Publishing \${targetId}\`);
        return { publishedUrl: \`/\${targetId.replace(/ /g, "-")}\` };`,
  `case "PublisherAgent":
        logger.info(\`[PublisherAgent] Publishing \${targetId}\`);
        if (!context.title || !context.optimized_article) {
          throw new Error("Missing title or article content for PublisherAgent");
        }
        const wpRes = await publishToWordPress({ title: context.title, article: context.optimized_article });
        if (!wpRes || !wpRes.link) throw new Error("Failed to get published URL from WordPress");
        return { publishedUrl: wpRes.link };`
);

// DistributionAgent
code = code.replace(
  `case "DistributionAgent":
        logger.info(\`[DistributionAgent] Distributing \${targetId}\`);
        return { distributionChannels: ["Pinterest", "Email"] };`,
  `case "DistributionAgent":
        logger.info(\`[DistributionAgent] Distributing \${targetId}\`);
        if (!context.publishedUrl) throw new Error("Missing publishedUrl for DistributionAgent");
        const pinRes = await publishToPinterest({ 
          title: context.title || targetId, 
          description: context.research || targetId, 
          url: context.publishedUrl, 
          image: context.media?.[0]?.url || "" 
        });
        if (!pinRes || !pinRes.id) throw new Error("Failed to get pin ID from Pinterest");
        return { distributionChannels: ["Pinterest"], pinId: pinRes.id };`
);

// TrackingAgent
code = code.replace(
  `case "TrackingAgent":
        logger.info(
          \`[TrackingAgent] Attaching UTM and DB hooks for \${targetId}\`,
        );
        return {
          tracking_hooks: ["utm_source=autonomous", "utm_medium=engine"],
        };`,
  `case "TrackingAgent":
        throw new Error("NotImplementedError");`
);

// AnalyticsAgent
code = code.replace(
  `case "AnalyticsAgent":
        logger.info(
          \`[AnalyticsAgent] Registering default baseline for \${targetId}\`,
        );
        return { analytics_status: "baseline_secured" };`,
  `case "AnalyticsAgent":
        throw new Error("NotImplementedError");`
);

// OptimizationAgent
code = code.replace(
  `case "OptimizationAgent":
        logger.info(
          \`[OptimizationAgent] Generating A/B testing strategy for \${targetId}\`,
        );
        return { optimization_strategy: "A/B setup ready" };`,
  `case "OptimizationAgent":
        throw new Error("NotImplementedError");`
);

fs.writeFileSync('server/orchestrator/engine.ts', code);
