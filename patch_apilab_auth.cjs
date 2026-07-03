const fs = require('fs');
let code = fs.readFileSync('src/pages/APILab.tsx', 'utf8');

code = code.replace(
  /const res = await fetch\(selectedRoute, options\);/g,
  `
      const { auth } = await import('../firebase');
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': \`Bearer \${token}\`
        };
      }
      const res = await fetch(selectedRoute, options);
  `
);

fs.writeFileSync('src/pages/APILab.tsx', code);
