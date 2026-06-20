
import { WebOpsDiagnosis, WebOpsPatch } from "../types";
import crypto from "crypto";

export class WebOpsRepairAgent {
  async proposeFix(diagnosis: WebOpsDiagnosis): Promise<WebOpsPatch> {
    let patchType = "config_change";
    let target = "general_config";
    let change = {};
    let riskLevel: "low" | "medium" | "high" = "medium";
    let requiresApproval = true;

    if (diagnosis.issueId.includes("api_latency") || diagnosis.rootCause.includes("rate limiting")) {
      target = "pinterest_rate_limiter";
      change = {
        maxRequestsPerMinute: 40,
        backoffMs: 2000
      };
      riskLevel = "low";
      requiresApproval = false; // Safe to auto-adjust within bounds
    }

    return {
      id: crypto.randomUUID(),
      patchType,
      target,
      change,
      riskLevel,
      requiresApproval,
      status: "proposed"
    };
  }
}
