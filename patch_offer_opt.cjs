const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/offerOptimizer.ts', 'utf8');

code = code.replace(
  `export async function optimizeOffers() {
  try {`,
  `export async function optimizeOffers() {
  logger.warn("[Offer Intelligence] Legacy global offer optimizer disabled. Thompson Sampling (banditEngine.ts) is the sole production offer-selection system.");
  return;
  try {`
);

fs.writeFileSync('server/workers/agents/offerOptimizer.ts', code);
