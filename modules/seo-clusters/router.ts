import { Router } from "express";
import { createCluster, getCluster, getNodes, getJobs, updateCluster } from "./clusterController";
import { seoClusterFlags } from "./featureFlags";

const router = Router();

router.use((req, res, next) => {
  if (!seoClusterFlags.SEO_CLUSTERS_ENABLED) {
    return res.status(503).json({ error: "Feature disabled" });
  }
  next();
});

router.post("/", createCluster);
router.get("/:id", getCluster);
router.get("/:id/nodes", getNodes);
router.get("/:id/jobs", getJobs);
router.patch("/:id", updateCluster);

export const clustersRouter = router;
