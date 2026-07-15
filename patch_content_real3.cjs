const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/dashboard/Content.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Math\.random\(\) \* \d+/g, "0");
fs.writeFileSync(file, content);
