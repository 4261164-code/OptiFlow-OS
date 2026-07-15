const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/dashboard/Overview.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/clicksToday: Math\.floor\(Math\.random\(\) \* 50\),/, "clicksToday: 0, /* Fetched separately or from clicksSnap.size */");
content = content.replace(/avgCtr: 2\.4,/, "avgCtr: 0,");

fs.writeFileSync(file, content);
