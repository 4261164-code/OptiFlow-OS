# SEO Clusters Engine - Vibe Coding

## Overview
This module handles autonomous, parallelized generation of topic clusters and keyword groups. It is entirely non-destructive and operates on its own dedicated jobs queue and Firestore collections.

## 1. New Files List
- `modules/seo-clusters/index.ts` - feature flag gate + module exports
- `modules/seo-clusters/router.ts` - Express router (mounted separately)
- `modules/seo-clusters/clusterController.ts` - request handlers for CRUD ops
- `modules/seo-clusters/clusterService.ts` - core business logic for node generation
- `modules/seo-clusters/keywordGenerator.ts` - AI keyword expansion (20–50 keywords)
- `modules/seo-clusters/jobQueue.ts` - independent cluster job queue
- `modules/seo-clusters/firestoreHelpers.ts` - Firestore read/write utilities
- `modules/seo-clusters/logger.ts` - structured logging to agent_logs
- `modules/seo-clusters/featureFlags.ts` - ENV switches
- `modules/seo-clusters/README.md` - migration and rollback guide

## 2. New Firestore Collections
1. `topic_clusters`: Tracks root keyword, overall statistics (`nodeCount`, `jobCount`, `completedJobs`, `errorCount`), and workflow status.
2. `cluster_nodes`: Tracks individually generated supporting keywords, intents, and volume.
3. `cluster_jobs`: Independent tracking of generated articles with `status`, `errorMessage`, and linking to output `articleId`.
4. `cluster_links`: Tracks inter-node internal connections (if `SEO_CLUSTERS_LINK_MAP` is enabled).
5. `pillar_pages`: The central hub node for the cluster, storing AI outlines.

## 3. New Environment Variables
- `SEO_CLUSTERS_ENABLED`: Master switch (`true` / `false`)
- `SEO_CLUSTERS_JOB_QUEUE_ENABLED`: Background job queue toggle (`true` / `false`)
- `SEO_CLUSTERS_LINK_MAP`: Write toggle for link mapping output (`true` / `false`)

## 4. Confirmation of Zero Modifications
We confirm that absolutely zero existing Campaign Builder logic or `/api` article generation endpoints were modified.
**The only modified file:**
- `server.ts`: We added 1 line (`app.use("/api/clusters", (await import("./modules/seo-clusters/router")).default);`) to mount the new Express router.

## 5. Rollback Plan
1. Delete the `modules/seo-clusters` folder.
2. Remove the single `app.use("/api/clusters", ...)` line from `server.ts`.
3. Drop the 5 new collections from Firestore (`topic_clusters`, `cluster_nodes`, `cluster_jobs`, `cluster_links`, `pillar_pages`).

## 6. Risks and Dependencies
- **Rate Limiting:** Background jobs invoke Gemini LLMs for standalone article generation; ensure concurrent quotas account for running clusters. Wait delays (`setTimeout`) are in place.
- No direct dependencies on existing article jobs, which mitigates shared point of failure risks.
