import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";
import { SystemEvent } from "../schema";
import { OrchestrationEngine } from "../orchestrator/engine";
import { TriggerEvent } from "../orchestrator/types";

export class EventEngine {
  
  static async publishEvent(type: SystemEvent["type"], payload: any): Promise<string> {
    const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const event: SystemEvent = {
      event_id: eventId,
      type,
      payload,
      status: 'pending',
      created_at: Date.now(),
      log: []
    };

    await db.collection("system_events").doc(eventId).set(event);
    logger.info(`[EventEngine] Published event: ${type} (${eventId})`);
    
    return eventId;
  }

  static async processEvents() {
    const snap = await db.collection("system_events")
        .where("status", "==", "pending")
        .limit(10)
        .get();

    if (snap.empty) return;

    for (const doc of snap.docs) {
       const event = doc.data() as SystemEvent;
       await doc.ref.update({ status: 'processing' });
       
       let outcomeLog = `Started processing event ${event.event_id} of type ${event.type}`;
       
       try {
          await this.routeEvent(event);
          await doc.ref.update({ 
             status: 'completed', 
             processed_at: Date.now(),
             log: [...(event.log || []), outcomeLog, `Successfully processed ${event.type}`]
          });
       } catch (err: any) {
          logger.error(`[EventEngine] Failed processing ${event.event_id}: ${err.message}`);
          await doc.ref.update({ 
             status: 'failed', 
             processed_at: Date.now(),
             log: [...(event.log || []), outcomeLog, `Failed: ${err.message}`]
          });
       }
    }
  }

  private static async routeEvent(event: SystemEvent) {
    const userId = event.payload?.user_id || "admin";

    switch (event.type) {
      case 'keyword_discovered':
        // Loop 1: SEO Growth Loop
        // Keyword -> Content -> Publish -> Rank -> Improve -> Expand cluster
        logger.info(`[EventEngine] Triggering SEO Growth Loop for keyword: ${event.payload.keyword}`);
        await OrchestrationEngine.startNewJob(userId, "new_keyword", event.payload.keyword, { 
            sourceEvent: event.event_id, 
            loop: "SEO Growth" 
        });
        break;

      case 'high_epc_offer':
      case 'conversion_increase':
        // Loop 2: Revenue Loop
        logger.info(`[EventEngine] Triggering Revenue Loop for offer: ${event.payload.offer_id}`);
        await OrchestrationEngine.startNewJob(userId, "high_performing_article", event.payload.offer_id, {
            sourceEvent: event.event_id,
            loop: "Revenue Scaling"
        });
        break;

      case 'traffic_spike':
      case 'article_published':
        // Loop 3: Content Loop
        logger.info(`[EventEngine] Triggering Content Loop for article: ${event.payload.article_id}`);
        await OrchestrationEngine.startNewJob(userId, "high_performing_article", event.payload.article_id, {
            sourceEvent: event.event_id,
            loop: "Content Expansion"
        });
        break;
        
      case 'revenue_drop':
        logger.info(`[EventEngine] Triggering Emergency Optimization Loop for target: ${event.payload.target_id}`);
        await OrchestrationEngine.startNewJob(userId, "revenue_drop", event.payload.target_id, {
            sourceEvent: event.event_id,
            loop: "Emergency Optimization"
        });
        break;

      default:
        logger.warn(`[EventEngine] Unhandled event type: ${event.type}`);
        break;
    }
  }
}
