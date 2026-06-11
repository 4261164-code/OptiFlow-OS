import { log } from "./logger";
import { generateClusterNodes } from "./keywordGenerator";
import { firestoreHelpers } from "./firestoreHelpers";

function generateId() {
  return Array.from({ length: 20 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
}

export async function runClusterPlanningJob(clusterId: string, rootKeyword: string, userId: string, targetCount = 20): Promise<void> {
  try {
    await log.started(userId, `Initiating cluster expansion for root topic: ${rootKeyword}`, clusterId);
    
    await log.info(userId, `Generating semantic child nodes with LLM expansion...`, clusterId);
    
    // Mitigate Rate Limits & Hallucinations by delegating to dedicated module
    const nodesData = await generateClusterNodes(rootKeyword, targetCount);
    
    await log.success(userId, `Generated ${nodesData.length} topic nodes securely. Populating architecture into database.`, clusterId);

    // Save nodes to Firestore
    for (const node of nodesData) {
      const nodeId = `node-${generateId()}`;
      
      if (node.isPillar) {
        await firestoreHelpers.getCollection("pillar_pages").doc(nodeId).set({
          id: nodeId,
          clusterId,
          keyword: node.keyword,
          outline: [],
          status: 'pending',
          articleId: null
        });
      }

      await firestoreHelpers.getCollection("cluster_nodes").doc(nodeId).set({
        id: nodeId,
        clusterId,
        keyword: node.keyword,
        intent: node.searchIntent,
        searchVolume: node.searchVolume || 0,
        status: 'pending'
      });
      
      // Also spawn cluster_jobs right away with 'queued' status
      const jobId = `cjob-${generateId()}`;
      await firestoreHelpers.getCollection("cluster_jobs").doc(jobId).set({
        id: jobId,
        clusterId,
        nodeId,
        keyword: node.keyword,
        status: 'queued',
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        articleId: null
      });
    }

    await firestoreHelpers.doc('topic_clusters', clusterId).update({
      status: 'jobs_queued',
      nodeCount: nodesData.length,
      jobCount: nodesData.length,
      updatedAt: Date.now()
    });
    
    await log.info(userId, `Queued ${nodesData.length} worker threads to construct articles independently.`, clusterId);

  } catch (err: any) {
    console.error("runClusterPlanningJob error:", err);
    await log.error(userId, `Cluster blueprint failed: ${err.message}`, clusterId);
    await firestoreHelpers.doc('topic_clusters', clusterId).update({
      status: 'error',
      updatedAt: Date.now()
    });
  }
}
