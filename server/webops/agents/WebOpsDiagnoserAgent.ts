
import { WebOpsIssue, WebOpsDiagnosis } from "../types";

export class WebOpsDiagnoserAgent {
  async diagnose(issues: WebOpsIssue[]): Promise<WebOpsDiagnosis[]> {
    return issues.map(issue => {
      let rootCause = "Unknown";
      let suggestedFix = "Manual investigation required";
      let confidence = 0.5;

      if (issue.type === "api_latency") {
        rootCause = "Rate limiting spike / Upstream pressure";
        suggestedFix = "Increase retry backoff + reduce request burst";
        confidence = 0.86;
      } else if (issue.type === "high_error_rate") {
        rootCause = "Database connection pool exhaustion";
        suggestedFix = "Scale connection pool / Check for leaking transactions";
        confidence = 0.75;
      }

      return {
        issueId: issue.id,
        rootCause,
        confidence,
        suggestedFix
      };
    });
  }
}
