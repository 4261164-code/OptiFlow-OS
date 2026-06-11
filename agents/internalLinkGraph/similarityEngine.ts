export function computeSimilarity(contentA: string, contentB: string): number {
  if (contentA == null || contentB == null) throw new Error("Input string is null");
  if (!contentA.trim() && !contentB.trim()) return 0.0;
  if (contentA === contentB) return 1.0;

  const wordsA = new Set(contentA.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const wordsB = new Set(contentB.toLowerCase().split(/\W+/).filter(w => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const score = intersection / Math.max(wordsA.size, wordsB.size);
  return Math.min(score * 1.5, 1.0); // simple booster for simulation
}
