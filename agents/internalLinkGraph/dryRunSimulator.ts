import { logLinkGraphEvent } from "./logger";

export async function runSimulation(clusterId: string, linksCreated: number, byArticle: any[], confidenceDistribution: any) {
  // Performs no writes except to logger
  await logLinkGraphEvent("dry_run_complete", {
    clusterId,
    dryRun: true,
    linksSimulated: linksCreated,
    byArticle,
    confidenceDistribution,
    approvalRequired: true
  });
  
  return {
    clusterId,
    dryRun: true,
    linksSimulated: linksCreated,
    byArticle,
    confidenceDistribution,
    approvalRequired: true
  };
}
