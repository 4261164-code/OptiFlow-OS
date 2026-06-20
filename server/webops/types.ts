
export enum WebOpsEventType {
  CONTENT_GENERATED = "content.generated",
  CONTENT_APPROVED = "content.approved",
  PIN_SCHEDULED = "pin.scheduled",
  PIN_PUBLISHED = "pin.published",
  REVENUE_POSTED = "revenue.posted",
  ANOMALY_DETECTED = "anomaly.detected",
  COST_UPDATED = "cost.updated",

  // WEBOPS SPECIFIC EVENTS
  WEBOPS_SCAN = "webops.scan",
  WEBOPS_ISSUE_DETECTED = "webops.issue.detected",
  WEBOPS_FIX_PROPOSED = "webops.fix.proposed",
  WEBOPS_SEO_UPDATED = "webops.seo.updated"
}

export type WebOpsIssueSeverity = "low" | "medium" | "high" | "critical";

export interface WebOpsIssue {
  id: string;
  type: string;
  severity: WebOpsIssueSeverity;
  service: string;
  evidence: any;
  timestamp: number;
  status: "open" | "diagnosing" | "resolved" | "ignored";
}

export interface WebOpsDiagnosis {
  issueId: string;
  rootCause: string;
  confidence: number;
  suggestedFix: string;
}

export interface WebOpsPatch {
  id: string;
  patchType: string;
  target: string;
  change: any;
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  status: "proposed" | "approved" | "rejected" | "applied" | "failed";
}

export const AllowedWebOpsActions = [
  "config_change",
  "seo_update",
  "cache_clear",
  "retry_policy_adjustment"
];
