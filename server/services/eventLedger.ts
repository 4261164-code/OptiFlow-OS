import { logger } from "../lib/logger";
import { db } from "../firebaseAdmin";
import { FEATURE_FLAGS } from "./featureFlags";
import crypto from "crypto";

export type LedgerEventType = "click" | "conversion" | "revenue" | "refund";

export interface LedgerEvent {
  id: string;
  eventType: LedgerEventType;
  sourceId: string;
  timestamp: number;
  userId: string;
  offerId?: string;
  articleId?: string;
  pinId?: string;
  amount?: number;
  source?: string;
}

export async function logLedgerEvent(params: {
  eventType: LedgerEventType;
  sourceId: string;
  userId: string;
  offerId?: string;
  articleId?: string;
  pinId?: string;
  amount?: number;
  source?: string;
}) {
  if (!FEATURE_FLAGS.ENABLE_EVENT_LEDGER) {
    return;
  }

  const eventId = `evt-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
  const eventData: LedgerEvent = {
    id: eventId,
    eventType: params.eventType,
    sourceId: params.sourceId,
    timestamp: Date.now(),
    userId: params.userId,
    offerId: params.offerId || "",
    articleId: params.articleId || "",
    pinId: params.pinId || "",
    amount: params.amount !== undefined ? Number(params.amount) : 0,
    source: params.source || ""
  };

  try {
    await db.collection("event_ledger").doc(eventId).set(eventData);
    logger.info(`[Event Ledger] Successfully appended event ${eventId} of type ${params.eventType} (Source ID: ${params.sourceId})`);
  } catch (error: any) {
    logger.error(`[Event Ledger] Failed to write event to ledger:`, error);
  }
}
