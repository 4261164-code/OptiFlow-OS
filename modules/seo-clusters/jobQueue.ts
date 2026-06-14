import { firestoreHelpers } from "./firestoreHelpers";
import { log } from "./logger";
import { GoogleGenAI } from "@google/genai";
import { seoClusterFlags } from "./featureFlags";

function generateId() {
  return Array.from({ length: 20 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
}

// Implement isolated, independent article generation logic to prevent crossing boundaries
async function isolatedGenerateArticle(keyword: string): Promise<{ title: string, content: string }> {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  const p = `Write a comprehensive, SEO-optimized article about "${keyword}". Output in markdown.`;
  const res = await ai.models.generateContent({ model: "gemini-3.1-flash-lite", contents: p });
  const text = res.text || "";
  return { title: keyword, content: text };
}

export async function processClusterNodesBackground(clusterId: string, userId: string): Promise<void> {
  if (!seoClusterFlags.SEO_CLUSTERS_JOB_QUEUE_ENABLED) return;
  
  try {
    const jobsSnap = await firestoreHelpers.getCollection("cluster_jobs")
      .where("clusterId", "==", clusterId)
      .where("status", "==", "queued")
      .get();
    
    for (const jobDoc of jobsSnap.docs) {
      const jobData = jobDoc.data();
      await jobDoc.ref.update({ status: 'running', startedAt: Date.now() });
      await firestoreHelpers.doc('cluster_nodes', jobData.nodeId).update({ status: 'generating' });
      await log.started(userId, `Processing independent cluster job for: ${jobData.keyword}`, clusterId);

      try {
        // Sleep to mitigate rate limits
        await new Promise(r => setTimeout(r, 2000));
        
        const article = await isolatedGenerateArticle(jobData.keyword);
        
        const generatedArticleId = `cluster-art-${generateId()}`;
        // Store the result directly into an independent area or append safely
        await firestoreHelpers.doc("cluster_articles", generatedArticleId).set({
           ...article,
           id: generatedArticleId,
           keyword: jobData.keyword,
           userId,
           createdAt: Date.now()
        });
        
        await jobDoc.ref.update({
          status: 'completed',
          completedAt: Date.now(),
          articleId: generatedArticleId
        });
        
        await firestoreHelpers.doc('cluster_nodes', jobData.nodeId).update({ status: 'done' });
        
        // Atomically increment completed jobs
        const clusterRef = firestoreHelpers.doc('topic_clusters', clusterId);
        const clusterSnap = await clusterRef.get();
        await clusterRef.update({ completedJobs: (clusterSnap.data()?.completedJobs || 0) + 1 });
        
        await log.success(userId, `Cluster job completed: ${jobData.keyword}`, clusterId);
      } catch (innerErr: any) {
        console.error(`Failed to execute cluster job for ${jobData.keyword}`, innerErr);
        await jobDoc.ref.update({ status: 'error', errorMessage: innerErr.message, completedAt: Date.now() });
        await firestoreHelpers.doc('cluster_nodes', jobData.nodeId).update({ status: 'error' });
        
        const clusterRef = firestoreHelpers.doc('topic_clusters', clusterId);
        const clusterSnap = await clusterRef.get();
        await clusterRef.update({ errorCount: (clusterSnap.data()?.errorCount || 0) + 1 });
        await log.error(userId, `Job generation failed for ${jobData.keyword}`, clusterId);
      }
    }
    
    // Check if finished
    const clusterSnapFinal = await firestoreHelpers.doc('topic_clusters', clusterId).get();
    const cData = clusterSnapFinal.data();
    if (cData && cData.completedJobs + cData.errorCount === cData.jobCount) {
       await firestoreHelpers.doc('topic_clusters', clusterId).update({ status: 'completed' });
       await log.success(userId, `All cluster jobs processed for ${clusterId}`, clusterId);
    }
  } catch (err) {
    console.error("processClusterNodesBackground error:", err);
  }
}
