// Centralized Feature Flags for AffiliateOS System Hardening

export const FEATURE_FLAGS = {
  // Task 2: Immutable Event Ledger
  get ENABLE_EVENT_LEDGER(): boolean {
    return process.env.ENABLE_EVENT_LEDGER !== "false";
  },

  // Task 5: Cost & Profit Tracking Layer
  get ENABLE_COST_TRACKING(): boolean {
    return process.env.ENABLE_COST_TRACKING !== "false";
  },

  // Task 4: Pre-Aggregated Analytics System
  get ENABLE_AGGREGATION_WORKERS(): boolean {
    return process.env.ENABLE_AGGREGATION_WORKERS !== "false";
  },
};
