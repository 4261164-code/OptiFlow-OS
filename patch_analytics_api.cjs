const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server/routes/api/analytics.ts');
let content = fs.readFileSync(file, 'utf8');

const newRoute = `
// GET /api/analytics/lab
router.get("/lab", async (req: any, res) => {
  try {
    const articlesSnap = await db.collection("articles").limit(10).get();
    const keywordData = articlesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.keyword || data.title || "Unknown",
        searches: Math.floor(Math.random() * 20000) + 1000,
        pos: Math.floor(Math.random() * 20) + 1,
        convRate: (Math.random() * 5).toFixed(1)
      };
    });
    
    const trendData = [
      { name: 'Jan', clicks: 4000, rev: 2400 },
      { name: 'Feb', clicks: 3000, rev: 1398 },
      { name: 'Mar', clicks: 2000, rev: 9800 },
      { name: 'Apr', clicks: 2780, rev: 3908 },
      { name: 'May', clicks: 1890, rev: 4800 },
      { name: 'Jun', clicks: 2390, rev: 3800 },
      { name: 'Jul', clicks: 3490, rev: 4300 },
    ];
    
    res.json({
      keywordData,
      trendData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
`;

content = content.replace(/export default router;/, newRoute);
fs.writeFileSync(file, content);
