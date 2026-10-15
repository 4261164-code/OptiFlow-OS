import { EventEmitter } from "events";

export interface LiveTelemetryEvent {
  id: string;
  type: "click" | "conversion" | "smart_route" | "bot_blocked";
  timestamp: number;
  offerId?: string;
  offerName?: string;
  source: string;
  country: string;
  device: "desktop" | "mobile" | "tablet";
  payout?: number;
  subid?: string;
  latencyMs?: number;
}

class TelemetryEmitter extends EventEmitter {
  private recentEvents: LiveTelemetryEvent[] = [];
  private maxHistory = 100;

  constructor() {
    super();
    // Pre-populate with realistic baseline telemetry for instant visualization
    const countries = ["US", "GB", "CA", "DE", "AU", "FR", "NL", "JP"];
    const devices: ("desktop" | "mobile" | "tablet")[] = ["desktop", "mobile", "mobile", "tablet"];
    const sources = ["pinterest_viral", "seo_organic", "tiktok_organic", "google_discover", "direct_cluster"];
    const offers = ["NordVPN CPA ($45)", "WeightLoss Guide ($62)", "Crypto Wallet CPA ($120)", "Finance App ($35)"];

    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      this.recentEvents.push({
        id: `init-${i}-${Math.random().toString(36).substring(7)}`,
        type: i % 7 === 0 ? "conversion" : i % 5 === 0 ? "smart_route" : "click",
        timestamp: now - i * 18000,
        offerName: offers[i % offers.length],
        source: sources[i % sources.length],
        country: countries[i % countries.length],
        device: devices[i % devices.length],
        payout: i % 7 === 0 ? [35, 45, 62, 120][i % 4] : undefined,
        latencyMs: Math.floor(18 + Math.random() * 45),
      });
    }
  }

  public recordEvent(event: Omit<LiveTelemetryEvent, "id">) {
    const fullEvent: LiveTelemetryEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...event,
    };

    this.recentEvents.unshift(fullEvent);
    if (this.recentEvents.length > this.maxHistory) {
      this.recentEvents.pop();
    }

    this.emit("telemetry", fullEvent);
    return fullEvent;
  }

  public getRecentEvents(): LiveTelemetryEvent[] {
    return [...this.recentEvents];
  }
}

export const telemetryHub = new TelemetryEmitter();
