# Internal Link Graph Agent - Migration Notes

## 1. New files list
- `agents/internalLinkGraph/index.ts` - entry point + feature flag gate
- `agents/internalLinkGraph/agent.ts` - orchestration: reads cluster, runs pipeline
- `agents/internalLinkGraph/articleReader.ts` - reads completed articles from Firestore
- `agents/internalLinkGraph/similarityEngine.ts` - semantic similarity scoring between articles
- `agents/internalLinkGraph/anchorGenerator.ts` - contextual anchor text generation via AI
- `agents/internalLinkGraph/linkMapper.ts` - builds link graph, applies confidence threshold
- `agents/internalLinkGraph/injector.ts` - safely injects links into versioned article copy
- `agents/internalLinkGraph/versionManager.ts` - creates snapshots, manages rollback
- `agents/internalLinkGraph/dryRunSimulator.ts` - simulates all link ops, outputs report
- `agents/internalLinkGraph/logger.ts` - structured logs → agent_logs collection
- `agents/internalLinkGraph/featureFlags.ts` - enable/disable agent instantly
- `agents/internalLinkGraph/__tests__/*` - Test suite for TDD

## 2. New Firestore collection
- `article_versions`: Schema includes `{ id, articleId, clusterId, versionNum, content, createdBy, createdAt, isRollback, linkedAt }`. Needs index on `articleId` and `versionNum`.
- `cluster_links`: Schema extended with `{ similarityScore, anchorQuality, compositeScore, approved, dryRun }`.

## 3. New environment variables
- `LINK_GRAPH_AGENT_ENABLED`: default true
- `DRY_RUN`: default true
- `CONFIDENCE_THRESHOLD`: default 0.6
- `MAX_LINKS_PER_ARTICLE`: default 5

## 4. Trigger mechanism
Event-driven trigger. Can be initiated via an API endpoint `/api/clusters/:id/generate-links` or integrated to run upon successful completion of all cluster articles if cluster completes via the job queue worker. It will not modify the existing cluster generation workflow.

## 5. Confirmation of zero modifications
- No existing files or campaign generation logic are touched.
- `server.ts` will not be altered unless we expose an explicit endpoint to trigger it, but for isolation, we keep this agent unmounted until manually executed or hooked without interfering in existing endpoints.

## 6. Rollback plan
- Delete `agents/internalLinkGraph/` folder.
- Delete `article_versions` collection.
- Delete any records generated in `cluster_links` by this tool.

## 7. Risks and dependencies
- Ensuring version snapshots strictly do not mutate the main source articles is paramount.
- Cost associated with calling AI anchor generator per inter-article edge `(N*(N-1))`.
