const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/dailyBrain.ts', 'utf8');

code = code.replace(
  `         } catch(e) {
             logger.error("[Daily Brain] Failed to parse JSON from AI.");
         }
     for (const action of decisions.actions) {`,
  `         } catch(e) {
             logger.error("[Daily Brain] Failed to parse JSON from AI.");
         }
     }
     for (const action of decisions.actions) {`
);

code = code.replace(
  `    const conversionsSnap = await db.collection("conversions").get();
    let totalRevenue = 0;
    conversionsSnap.forEach(doc => totalRevenue += (doc.data().revenue || 0));

    // Simple mock logic to fetch top and low content
    const contentSnap = await db.collection("content").limit(2).get();
    let contents: any[] = [];
    contentSnap.forEach(doc => contents.push({ id: doc.id, ...doc.data() }));
    const topContent = contents[0]?.id || "none";
    const lowContent = contents[1]?.id || "none";`,
  `    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentConversions = await db.collection("conversions")
      .where("timestamp", ">=", thirtyDaysAgo)
      .limit(1000)
      .get();
    let totalRevenue = 0;
    recentConversions.forEach(doc => totalRevenue += (doc.data().revenue || doc.data().amount || 0));

    const topContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "desc")
      .limit(1)
      .get();
    const topContent = topContentSnap.empty ? "none" : topContentSnap.docs[0].data().articleId || topContentSnap.docs[0].id;

    const lowContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "asc")
      .limit(1)
      .get();
    const lowContent = lowContentSnap.empty ? "none" : lowContentSnap.docs[0].data().articleId || lowContentSnap.docs[0].id;`
);

fs.writeFileSync('server/workers/agents/dailyBrain.ts', code);
