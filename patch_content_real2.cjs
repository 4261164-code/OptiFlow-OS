const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/dashboard/Content.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/clicks: Math\.floor\(Math\.random\(\) \* 100\)/g, "clicks: data.clicks || 0");
content = content.replace(/rev: '\$' \+ \(Math\.floor\(Math\.random\(\) \* 20\)\)/g, "rev: '$' + (data.revenue || 0)");

fs.writeFileSync(file, content);
