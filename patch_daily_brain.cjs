const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/dailyBrain.ts', 'utf8');

code = code.replace(
  `     if (process.env.OPENAI_API_KEY) {`,
  `     if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy') {
         logger.error("[Daily Brain] OPENAI_API_KEY missing. Skipping decision cycle to avoid false operational status.");
         return;
     }

     if (process.env.OPENAI_API_KEY) {`
);

code = code.replace(
  `     } else {
         // Mock decision logic
         logger.info("[Daily Brain] Using mock decision engine (No OPENAI_API_KEY).");
         decisions = {
             actions: [
                 { type: "content", payload: { action: "clone_content", target: data.topContent } },
                 { type: "seo", payload: { action: "rewrite_title", target: data.lowContent } }
             ]
         };
     }`,
  ``
);

code = code.replace(
  `async function getSystemMetrics() {
    // Collect a quick snapshot of the DB state
    const conversionsSnap = await db.collection("conversions").get();
    let totalRevenue = 0;
    conversionsSnap.forEach(doc => totalRevenue += (doc.data().revenue || 0));

    // Simple mock logic to fetch top and low content
    const contentSnap = await db.collection("content").limit(2).get();
    let contents: any[] = [];
    contentSnap.forEach(doc => contents.push({ id: doc.id, ...doc.data() }));
    const topContent = contents[0]?.id || "none";
    const lowContent = contents[1]?.id || "none";`,
  `async function getSystemMetrics() {
    // Total Revenue using incremental rollup instead of full scan
    // For simplicity, we get the sum of revenue across article_metrics (which rolled up from postback.ts)
    // using aggregate query which is much faster/cheaper than full scan.
    const revenueSnap = await db.collection("article_metrics").count().get(); // Placeholder, wait, let's just do a time window limit or use aggregate if available.
    // If Admin SDK supports aggregate queries:
    // const aggregateQuery = db.collection("article_metrics").aggregate({ totalRev: require('firebase-admin/firestore').AggregateField.sum('revenue') });
    // Actually, to be safe and avoid SDK version issues, let's just use recent daily metrics
    
    // We'll query recent conversions (last 30 days) to avoid unbounded scan
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentConversions = await db.collection("conversions")
      .where("timestamp", ">=", thirtyDaysAgo)
      .orderBy("timestamp", "desc")
      .limit(1000)
      .get();
    let totalRevenue = 0;
    recentConversions.forEach(doc => totalRevenue += (doc.data().revenue || doc.data().amount || 0));

    // Get actual top content ordered by revenue
    const topContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "desc")
      .limit(1)
      .get();
    const topContent = topContentSnap.empty ? "none" : topContentSnap.docs[0].data().articleId || topContentSnap.docs[0].id;

    // Get actual low performing content (ordered by revenue asc)
    const lowContentSnap = await db.collection("article_metrics")
      .orderBy("revenue", "asc")
      .limit(1)
      .get();
    const lowContent = lowContentSnap.empty ? "none" : lowContentSnap.docs[0].data().articleId || lowContentSnap.docs[0].id;
`
);

fs.writeFileSync('server/workers/agents/dailyBrain.ts', code);
