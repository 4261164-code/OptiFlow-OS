
import { WebOpsPatch, AllowedWebOpsActions } from "./types";
import { logger } from "../lib/logger";

export class SafePatchEngine {
  async apply(patch: WebOpsPatch): Promise<{ status: string; reason?: string }> {
    if (!AllowedWebOpsActions.includes(patch.patchType)) {
      logger.warn(`[SafePatchEngine] Blocked unauthorized action type: ${patch.patchType}`);
      return {
        status: "blocked",
        reason: `Action type "${patch.patchType}" is not in the allowed list.`
      };
    }

    if (patch.riskLevel === "high" || (patch.riskLevel === "medium" && patch.requiresApproval)) {
      logger.info(`[SafePatchEngine] Patch ${patch.id} held for manual approval due to risk level: ${patch.riskLevel}`);
      return {
        status: "blocked",
        reason: "Requires manual approval based on safety policy."
      };
    }

    // In a real system, this would update Firestore config, Redis, or ENV variables
    logger.info(`[SafePatchEngine] Applying safe patch to ${patch.target}:`, { change: patch.change });

    // Simulated execution success
    return { status: "applied" };
  }
}
