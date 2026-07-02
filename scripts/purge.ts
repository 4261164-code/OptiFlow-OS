import { db } from '../server/firebaseAdmin';

async function purge() {
    const targetCollections = [
        "jobs",
        "articles",
        "pins",
        "image_retry_queue",
        "offers",
        "notifications",
        "topic_clusters",
        "cluster_nodes",
        "revenue_metrics",
        "agent_logs",
        "agent_nodes",
        "strategic_memory",
        "ceo_targets",
        "daily_metrics",
        "revenue_events",
        "affiliate_clicks",
        "affiliate_conversions",
        "change_proposals",
        "clicks",
        "conversions",
        "system_events",
        "system_faults",
        "agent_messages",
        "orchestration_jobs",
        "orchestration_tasks",
        "click_errors",
        "webops_seo_logs",
        "keywords",
        "campaigns",
        "analytics",
        "logs",
        "seo_clusters",
        "topics",
        "content_assets",
        "traffic_logs",
        "agent_activities",
        "audit_logs",
        "approval_queue",
        "circuit_breakers"
    ];

    let totalDeleted = 0;
    for (const collectionName of targetCollections) {
        const snapshot = await db.collection(collectionName).get();
        for (const doc of snapshot.docs) {
            await doc.ref.delete();
            totalDeleted++;
        }
    }
    console.log(`Deleted ${totalDeleted} documents`);
}

purge().then(() => process.exit(0)).catch(console.error);
