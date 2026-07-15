const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/dashboard/AnalyticsLab.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const keywordData = \[.*?\];/s,
  `const [keywordData, setKeywordData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(Array(24).fill(0)));
  
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/lab');
        if (res.ok) {
          const data = await res.json();
          setKeywordData(data.keywordData || []);
          setTrendData(data.trendData || []);
          if (data.heatmapData) setHeatmapData(data.heatmapData);
        }
      } catch (e) {
        console.error("Failed to fetch analytics data", e);
      }
    }
    fetchData();
  }, []);`
);

content = content.replace(/const trendData = \[.*?\];/s, '');
content = content.replace(/const heatmapData = .*?\);/s, '');

fs.writeFileSync(file, content);
