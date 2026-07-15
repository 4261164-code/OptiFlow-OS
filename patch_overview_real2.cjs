const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/dashboard/Overview.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const postbacksSnap = await getDocs\(query\(collection\(db, 'postbacks'\), limit\(100\)\)\);/, 
  `const postbacksSnap = await getDocs(query(collection(db, 'postbacks'), limit(100)));
        const clicksSnap = await getDocs(query(collection(db, 'clicks'), limit(100)));`);

content = content.replace(/clicksToday: 0, \/\* Fetched separately or from clicksSnap.size \*\//, "clicksToday: clicksSnap.size,");

fs.writeFileSync(file, content);
