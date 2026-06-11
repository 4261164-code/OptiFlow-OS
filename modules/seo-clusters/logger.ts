import { db } from "../../server/firebaseAdmin";

export async function logClusterEvent(event: string, payload: any) {
  try {
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.collection("agent_logs").doc(logId).set({
      ...payload,
      event,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Cluster Logger Error:", err);
  }
}

export const log = {
  info: (userId: string, message: string, clusterId?: string) => 
    logClusterEvent("cluster_info", { userId, message, clusterId, status: "info" }),
  started: (userId: string, message: string, clusterId?: string) => 
    logClusterEvent("cluster_started", { userId, message, clusterId, status: "running" }),
  success: (userId: string, message: string, clusterId?: string) => 
    logClusterEvent("cluster_success", { userId, message, clusterId, status: "success" }),
  error: (userId: string, message: string, clusterId?: string) => 
    logClusterEvent("cluster_error", { userId, message, clusterId, status: "error" }),
};
