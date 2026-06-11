import { linkGraphFlags } from "./featureFlags";
import { logLinkGraphEvent } from "./logger";
import { readClusterArticles } from "./articleReader";
import { computeSimilarity } from "./similarityEngine";
import { generateAnchorText } from "./anchorGenerator";
import { evaluateLink, buildLinkGraph } from "./linkMapper";
import { createSnapshot } from "./versionManager";
import { injectLinks } from "./injector";
import { runSimulation } from "./dryRunSimulator";
import { db } from "../../server/firebaseAdmin";

export const executeLinkGraphPipeline = async (clusterId: string, runConfig?: { dryRun?: boolean }) => {
  if (!linkGraphFlags.LINK_GRAPH_AGENT_ENABLED) throw new Error("Agent Disabled");
  const isDryRun = runConfig?.dryRun !== undefined ? runConfig.dryRun : linkGraphFlags.DRY_RUN;

  // STEP 1 - Read cluster status & articles
  const clusterSnap = await db.collection("topic_clusters").doc(clusterId).get();
  if (!clusterSnap.exists) throw new Error(`Cluster ${clusterId} not found`);
  
  const status = clusterSnap.data()?.status;
  if (status !== "completed") throw new Error("Cluster must be 'completed' before running internalLinkGraph agent.");

  const articles = await readClusterArticles(clusterId);
  if (articles.length === 0) throw new Error("No completed articles found for cluster.");
  await logLinkGraphEvent("agent_started", { clusterId, articleCount: articles.length, dryRun: isDryRun });
  await logLinkGraphEvent("articles_loaded", { clusterId, articleIds: articles.map(a => a.id), dryRun: isDryRun });

  // STEP 2 - Calculate semantic similarity (NxN Matrix)
  const qualifiedPairs = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = 0; j < articles.length; j++) {
      if (i === j) continue;
      const source = articles[i];
      const target = articles[j];
      const similarityScore = computeSimilarity(source.content || "", target.content || "");
      await logLinkGraphEvent("similarity_scored", { clusterId, sourceId: source.id, targetId: target.id, score: similarityScore, qualified: similarityScore > 0, dryRun: isDryRun });
      
      if (similarityScore > 0.2) { // pre-qualify slightly related docs to send to AI
        qualifiedPairs.push({ source, target, similarityScore });
      }
    }
  }

  // STEP 3 - Generate and evaluate contextual anchors
  const allProposedLinks = [];
  let linksSimulated = 0;
  for (const pair of qualifiedPairs) {
    const anchorData = await generateAnchorText(pair.source.content, pair.target.keyword);
    // Score linking logic
    const { compositeScore, qualified } = evaluateLink(pair.similarityScore, anchorData.confidence);
    await logLinkGraphEvent("anchor_generated", { clusterId, sourceId: pair.source.id, targetId: pair.target.id, anchor: anchorData.anchor, confidence: anchorData.confidence, dryRun: isDryRun });

    if (qualified) {
      allProposedLinks.push({
        sourceId: pair.source.id,
        targetId: pair.target.id,
        anchorText: anchorData.anchor,
        similarityScore: pair.similarityScore,
        anchorQuality: anchorData.confidence,
        compositeScore,
        targetKeyword: pair.target.keyword
      });
      await logLinkGraphEvent("link_qualified", { clusterId, sourceId: pair.source.id, targetId: pair.target.id, compositeScore, anchorText: anchorData.anchor, dryRun: isDryRun });
    } else {
      await logLinkGraphEvent("link_rejected", { clusterId, sourceId: pair.source.id, targetId: pair.target.id, reason: "composite score too low", score: compositeScore, dryRun: isDryRun });
    }
  }

  // STEP 4 - Create link relationships and cap graph max
  const approvedLinkGraph = buildLinkGraph(allProposedLinks);
  const byArticleData: any = {};
  
  if (!isDryRun) {
    for (const link of approvedLinkGraph) {
       await db.collection("cluster_links").add({
           clusterId,
           ...link,
           dryRun: false,
           createdAt: Date.now()
       });
       linksSimulated++;
       if(!byArticleData[link.sourceId]) byArticleData[link.sourceId] = { topAnchors: [], linksOut: 0 };
       byArticleData[link.sourceId].topAnchors.push(link.anchorText);
       byArticleData[link.sourceId].linksOut++;
    }

    // STEP 5 - Inject Links Safely
    // Group links by source article
    const linksBySource = approvedLinkGraph.reduce((acc, l) => {
        if (!acc[l.sourceId]) acc[l.sourceId] = [];
        acc[l.sourceId].push(l);
        return acc;
    }, {} as Record<string, any[]>);

    for (const sourceId of Object.keys(linksBySource)) {
        const sourceArticle = articles.find(a => a.id === sourceId);
        if (!sourceArticle) continue;

        // SNAPSHOT EXCEPTIONLESS REQUIRED
        const { versionId } = await createSnapshot(sourceId, clusterId, sourceArticle.content);
        
        // Inject links into NEW versioned copy
        const { injectedContent, injectionPlan } = injectLinks(sourceArticle.content, linksBySource[sourceId]);
        
        for (const item of injectionPlan) {
            if (item.status === 'injected') {
                 logLinkGraphEvent("link_injected", { clusterId, articleId: sourceId, versionId, anchorText: item.anchorText, dryRun: false });
            } else {
                 logLinkGraphEvent("injection_skipped", { clusterId, articleId: sourceId, reason: "insertion_point_not_found", dryRun: false });
            }
        }
        
        // Store versioned copy alongside original, original remains unmodified
        await db.collection("article_versions").doc(versionId).update({ content: injectedContent, linkedAt: Date.now() });
    }

    await db.collection("topic_clusters").doc(clusterId).update({ linkGraphStatus: "completed" });
    await logLinkGraphEvent("agent_completed", { clusterId, linksCreated: linksSimulated, dryRun: false });
    
    return { success: true, linksCreated: linksSimulated };
  } else {
    // DRY RUN ONLY Phase
    for (const link of approvedLinkGraph) {
       linksSimulated++;
       if(!byArticleData[link.sourceId]) byArticleData[link.sourceId] = { topAnchors: [], linksOut: 0 };
       byArticleData[link.sourceId].topAnchors.push(link.anchorText);
       byArticleData[link.sourceId].linksOut++;
    }
    await db.collection("topic_clusters").doc(clusterId).update({ linkGraphStatus: "dry_run_complete" });
    const distribution = { high: 0, medium: 0, low: 0 };
    return runSimulation(clusterId, linksSimulated, Object.values(byArticleData), distribution);
  }
};
