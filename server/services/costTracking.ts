import { logger } from "../lib/logger";
import { db, hasServiceAccount } from "../firebaseAdmin";
import { FEATURE_FLAGS } from "./featureFlags";
import crypto from "crypto";

export type CostType = "ai_generation" | "image_generation" | "compute" | "pipeline_execution";

export interface CostEvent {
  id: string;
  type: CostType;
  cost: number;
  model?: string;
  entityId: string; // e.g., articleId, jobId, clusterId, etc.
  userId: string;
  timestamp: number;
  description?: string;
}

export async function logCostEvent(params: {
  type: CostType;
  cost: number;
  model?: string;
  entityId: string;
  userId: string;
  description?: string;
}) {
  if (!FEATURE_FLAGS.ENABLE_COST_TRACKING || !hasServiceAccount) {
    return;
  }

  const costId = `cost-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
  const costData: CostEvent = {
    id: costId,
    type: params.type,
    cost: Number(params.cost),
    model: params.model || "",
    entityId: params.entityId || "system",
    userId: params.userId || "system-fallback",
    timestamp: Date.now(),
    description: params.description || ""
  };

  try {
    await db.collection("cost_events").doc(costId).set(costData);
    logger.info(`[Cost Tracker] Logged cost event ${costId}: $${params.cost} for ${params.type}`);
  } catch (error: any) {
    logger.error(`[Cost Tracker] Failed to write cost event:`, error);
  }
}
