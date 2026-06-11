import { createCluster } from "./clusterController";
import { seoClusterFlags } from "./featureFlags";

export const SeoClustersModule = {
  isEnabled: seoClusterFlags.SEO_CLUSTERS_ENABLED,
  createCluster,
};
