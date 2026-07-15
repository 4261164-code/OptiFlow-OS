import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const app = initializeApp({ credential: applicationDefault(), projectId: "earn-pulse-51df9" });
const db = getFirestore(app, "ai-studio-optiflowos-b17ddf8c-b59f-4f82-8ac3-b7bf4fcbe0ce");
async function test() {
  try {
    const colls = await db.listCollections();
    console.log("Success! Collections:", colls.map(c => c.id));
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
