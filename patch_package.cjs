const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

code = code.replace(
  `"lint": "tsc --noEmit"`,
  `"lint": "tsc --noEmit",
    "test": "vitest run"`
);

fs.writeFileSync('package.json', code);
