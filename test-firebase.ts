import { db } from './server/firebaseAdmin';
async function test() {
  try {
    console.log("Fetching collections...");
    const colls = await db.listCollections();
    console.log("Collections:", colls.map(c => c.id));
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
