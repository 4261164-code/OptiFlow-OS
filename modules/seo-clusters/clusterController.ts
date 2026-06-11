import { Request, Response } from "express";
import { firestoreHelpers } from "./firestoreHelpers";
import { runClusterPlanningJob } from "./clusterService";
import { processClusterNodesBackground } from "./jobQueue";

function generateId() {
  return Array.from({ length: 20 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
}

export const createCluster = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rootKeyword, userId, targetCount, options } = req.body;
    
    if (!rootKeyword || !userId) {
      res.status(400).json({ error: "rootKeyword and userId are required" });
      return;
    }

    const clusterId = `cls-${generateId()}`;
    
    await firestoreHelpers.getCollection('topic_clusters').doc(clusterId).set({
      id: clusterId,
      rootKeyword,
      userId,
      status: 'initializing',
      nodeCount: 0,
      jobCount: 0,
      completedJobs: 0,
      errorCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      options: options || {}
    });

    // Fire & forget background job
    runClusterPlanningJob(clusterId, rootKeyword, userId, targetCount)
      .then(() => processClusterNodesBackground(clusterId, userId))
      .catch(err => {
        console.error("Cluster planning/execution failed:", err);
      });

    res.status(202).json({
      message: "Cluster generation started",
      clusterId,
      rootKeyword,
      status: "initializing"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCluster = async (req: Request, res: Response): Promise<void> => {
  try {
    const snap = await firestoreHelpers.getCollection('topic_clusters').doc(req.params.id).get();
    if (!snap.exists) {
      res.status(404).json({ error: "Cluster not found" });
      return;
    }
    res.json(snap.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getNodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const snap = await firestoreHelpers.getCollection('cluster_nodes')
      .where("clusterId", "==", req.params.id)
      .get();
    const nodes = snap.docs.map(doc => doc.data());
    res.json({ nodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const snap = await firestoreHelpers.getCollection('cluster_jobs')
      .where("clusterId", "==", req.params.id)
      .get();
    const jobs = snap.docs.map(doc => doc.data());
    res.json({ jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCluster = async (req: Request, res: Response): Promise<void> => {
  try {
    const ref = firestoreHelpers.getCollection('topic_clusters').doc(req.params.id);
    await ref.update({
      ...req.body,
      updatedAt: Date.now()
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
