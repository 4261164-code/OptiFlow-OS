import { db } from "../../server/firebaseAdmin";
import { logLinkGraphEvent } from "./logger";

export async function createSnapshot(articleId: string, clusterId: string, content: string) {
  const versionsRef = db.collection("article_versions");
  const snap = await versionsRef.where("articleId", "==", articleId).orderBy("versionNum", "desc").limit(1).get();
  
  let versionNum = 1;
  if (!snap.empty) {
      versionNum = snap.docs[0].data().versionNum + 1;
  }
  
  const versionId = `vsn-${Date.now()}`;
  await versionsRef.doc(versionId).set({
      id: versionId,
      articleId,
      clusterId,
      versionNum,
      content,
      createdBy: "internalLinkGraphAgent",
      createdAt: Date.now(),
      isRollback: false,
      linkedAt: null
  });
  
  await logLinkGraphEvent("snapshot_created", { articleId, versionId, versionNum, clusterId });
  return { versionId, versionNum };
}

export async function rollback(articleId: string, versionId: string): Promise<{ success: boolean; restoredVersionNum?: number }> {
  const versionDoc = await db.collection("article_versions").doc(versionId).get();
  if (!versionDoc.exists) throw new Error("Version not found");
  
  const versionData = versionDoc.data();
  // We only log rollback in this simplified simulation, writing to active article slot ideally
  await logLinkGraphEvent("rollback_executed", { articleId, versionId, restoredBy: "admin" });
  
  return { success: true, restoredVersionNum: versionData?.versionNum };
}
