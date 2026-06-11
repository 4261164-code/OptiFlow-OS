export const linkGraphFlags = {
  LINK_GRAPH_AGENT_ENABLED: process.env.LINK_GRAPH_AGENT_ENABLED !== "false",
  DRY_RUN: process.env.DRY_RUN !== "false", // Default to true unless explicitly explicitly disabled
  CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD || "0.6"),
  MAX_LINKS_PER_ARTICLE: parseInt(process.env.MAX_LINKS_PER_ARTICLE || "5", 10),
};
