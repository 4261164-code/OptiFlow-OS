import { logLinkGraphEvent } from "./logger";

export function injectLinks(originalContent: string, links: any[]): { injectedContent: string; injectedCount: number; skippedCounts: number; injectionPlan: any[] } {
  let content = originalContent;
  let injectedCount = 0;
  let skippedCounts = 0;
  const injectionPlan = [];

  for (const link of links) {
    const { anchorText, targetKeyword } = link; // mock URL generation via target article properties
    const linkUrl = `/article/${targetKeyword.toLowerCase().replace(/ /g, '-')}`; 
    const anchorRegex = new RegExp(`\\b${anchorText}\\b`, 'i');
    
    if (anchorRegex.test(content)) {
      content = content.replace(anchorRegex, `[${anchorText}](${linkUrl})`);
      injectedCount++;
      injectionPlan.push({ anchorText, url: linkUrl, status: "injected" });
    } else {
      skippedCounts++;
      injectionPlan.push({ anchorText, url: linkUrl, status: "skipped" });
    }
  }

  return { injectedContent: content, injectedCount, skippedCounts, injectionPlan };
}
