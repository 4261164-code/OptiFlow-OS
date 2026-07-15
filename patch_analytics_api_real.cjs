const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server/routes/api/analytics.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Math\.floor\(Math\.random\(\) \* 20000\) \+ 1000/, "data.searchVolume || 0");
content = content.replace(/Math\.floor\(Math\.random\(\) \* 20\) \+ 1/, "data.ranking || 0");
content = content.replace(/\(Math\.random\(\) \* 5\)\.toFixed\(1\)/, "data.conversionRate || 0");

fs.writeFileSync(file, content);
