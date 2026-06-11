import { db } from "../../server/firebaseAdmin";

export async function logLinkGraphEvent(event: string, payload: any) {
  try {
    const logId = `lg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.collection("agent_logs").doc(logId).set({
      agent: "internalLinkGraphAgent",
      event,
      timestamp: Date.now(),
      ...payload
    });
  } catch (err) {
    console.error("Link Graph logger failed:", err);
  }
}
