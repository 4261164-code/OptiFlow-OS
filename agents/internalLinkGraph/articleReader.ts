import { db } from "../../server/firebaseAdmin";

export async function readClusterArticles(clusterId: string): Promise<any[]> {
  const snap = await db.collection("cluster_articles").where("clusterId", "==", clusterId).get();
  // Fallback check against campaign articles if cluster articles empty
  if (snap.empty) {
     const campaignSnap = await db.collection("articles").where("clusterId", "==", clusterId).get();
     return campaignSnap.docs.map(d => ({ ...d.data(), id: d.id }));
  }
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}
