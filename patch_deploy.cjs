const fs = require('fs');
let code = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

code = code.replace(
  `      - name: Checkout
        uses: actions/checkout@v4`,
  `      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test`
);

fs.writeFileSync('.github/workflows/deploy.yml', code);
