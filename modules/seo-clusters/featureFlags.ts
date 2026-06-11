export const seoClusterFlags = {
  SEO_CLUSTERS_ENABLED: process.env.SEO_CLUSTERS_ENABLED !== "false", // Default to true unless explicitly explicitly disabled
  SEO_CLUSTERS_JOB_QUEUE_ENABLED: process.env.SEO_CLUSTERS_JOB_QUEUE !== "false",
  SEO_CLUSTERS_LINK_MAPPING: process.env.SEO_CLUSTERS_LINK_MAP !== "false",
};
