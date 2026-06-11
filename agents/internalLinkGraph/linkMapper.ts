import { linkGraphFlags } from "./featureFlags";

export function evaluateLink(similarityScore: number, anchorQuality: number): { compositeScore: number; qualified: boolean } {
  const compositeScore = (similarityScore * 0.6) + (anchorQuality * 0.4);
  return {
    compositeScore,
    qualified: compositeScore >= linkGraphFlags.CONFIDENCE_THRESHOLD
  };
}

export function buildLinkGraph(qualifiedPairs: any[], maxLinks = linkGraphFlags.MAX_LINKS_PER_ARTICLE) {
  // deduplicate and map outbound link counters
  const linksOutCount: Record<string, number> = {};
  const seenPairs = new Set<string>();
  const approvedLinks = [];
  
  // Sort pairs by top composite score
  qualifiedPairs.sort((a, b) => b.compositeScore - a.compositeScore);

  for (const pair of qualifiedPairs) {
    // skip self referencing
    if (pair.sourceId === pair.targetId) continue;
    
    const pairKey = `${pair.sourceId}->${pair.targetId}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    if (!linksOutCount[pair.sourceId]) linksOutCount[pair.sourceId] = 0;
    
    if (linksOutCount[pair.sourceId] < maxLinks) {
      linksOutCount[pair.sourceId]++;
      approvedLinks.push({
        ...pair,
        approved: false // Always false until human approves!
      });
    }
  }

  return approvedLinks;
}
