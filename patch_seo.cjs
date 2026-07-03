const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/seoOptimizer.ts', 'utf8');

code = code.replace(
  `export async function seoOptimizer(articleId: string) {
  try { `,
  `export async function seoOptimizer(articleId: string) {
  if (process.env.ENABLE_SEO_OPTIMIZER !== 'true') {
    logger.warn('[SEO Optimizer] Disabled via feature flag. Enable with ENABLE_SEO_OPTIMIZER=true');
    return;
  }
  if (!process.env.GSC_CREDENTIALS) {
    logger.warn('[SEO Optimizer] Enabled, but GSC_CREDENTIALS missing. Refusing to run on mock data.');
    return;
  }
  try { `
);

fs.writeFileSync('server/workers/agents/seoOptimizer.ts', code);
