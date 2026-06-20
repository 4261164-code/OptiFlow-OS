import { db } from "../firebaseAdmin";

export type GovernancePhase = 
  | "IDEA"
  | "PRD"
  | "ARCHITECTURE"
  | "BUILD"
  | "TEST"
  | "AUDIT"
  | "LIVE";

export interface ChangeProposal {
  id: string;
  title: string;
  description: string;
  authorId: string;
  phase: GovernancePhase;
  riskLevel: "low" | "medium" | "high" | "critical";
  approvers: string[]; // List of userIds who approved
  reviews: Review[];
  createdAt: number;
  updatedAt: number;
  deployAuditId?: string; // Binds to the actual deployment
}

export interface Review {
  reviewerId: string;
  rating: "approve" | "reject" | "changes_requested";
  comment: string;
  timestamp: number;
}

const PHASE_ORDER: GovernancePhase[] = [
  "IDEA",
  "PRD",
  "ARCHITECTURE",
  "BUILD",
  "TEST",
  "AUDIT",
  "LIVE"
];

export class GovernanceEngine {
  
  /**
   * Proposes a new change. Validates that the author is authenticated and stores it.
   */
  static async createProposal(authorId: string, title: string, description: string): Promise<ChangeProposal> {
    if (!authorId || !title) throw new Error("Missing author or title");
    
    // Risk classification logic (simple heuristic for demonstration, but server-enforced)
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    const content = (title + " " + description).toLowerCase();
    if (content.includes("billing") || content.includes("commission") || content.includes("auth")) {
      riskLevel = "critical";
    } else if (content.includes("database") || content.includes("api") || content.includes("route")) {
      riskLevel = "high";
    } else if (content.includes("schema") || content.includes("migration")) {
      riskLevel = "medium";
    }

    const proposal: Omit<ChangeProposal, 'id'> = {
      title,
      description,
      authorId,
      phase: "IDEA",
      riskLevel,
      approvers: [],
      reviews: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await db.collection("change_proposals").add(proposal);
    return { id: docRef.id, ...proposal };
  }

  /**
   * Advances the phase. Enforces strict linear progression.
   */
  static async transitionPhase(proposalId: string, userId: string, targetPhase: GovernancePhase, userRole: string): Promise<boolean> {
    const docRef = db.collection("change_proposals").doc(proposalId);
    
    return await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) {
        throw new Error("Proposal not found");
      }
      
      const proposal = snap.data() as ChangeProposal;
      const currentIndex = PHASE_ORDER.indexOf(proposal.phase);
      const targetIndex = PHASE_ORDER.indexOf(targetPhase);
      
      // Strict linear transition: can only advance to the exact next phase, or revert to an earlier phase
      if (targetIndex !== currentIndex + 1 && targetIndex > currentIndex) {
        // Enforce DEV-GATE-403 check logic
        console.warn(`DEV-GATE-403 Violation Attempt: User ${userId} tried to skip from ${proposal.phase} to ${targetPhase}`);
        throw new Error(`DEV-GATE-403: Strict governance linear progression violated. Cannot skip from ${proposal.phase} to ${targetPhase}.`);
      }

      if (targetIndex > currentIndex) { // Advancing
         // Enforce human approval requirements for high risk
         if (["high", "critical"].includes(proposal.riskLevel)) {
            // Need at least 1 approve review from someone OTHER than the author
            const validApproval = proposal.reviews.some(r => r.rating === "approve" && r.reviewerId !== proposal.authorId);
            if (!validApproval) {
               throw new Error(`Governance policy requires independent human approval for ${proposal.riskLevel} risk changes before advancing.`);
            }
         }
         
         // Audit to Live strictly requires an Admin
         if (targetPhase === "LIVE" && userRole !== "admin") {
            throw new Error(`Only an admin can deploy a proposal to LIVE.`);
         }
      }

      transaction.update(docRef, {
        phase: targetPhase,
        updatedAt: Date.now()
      });

      // Maintain an immutable ledger of transitions
      const transitionLogRef = db.collection("governance_audit_logs").doc();
      transaction.set(transitionLogRef, {
        proposalId,
        actorId: userId,
        actorRole: userRole,
        fromPhase: proposal.phase,
        toPhase: targetPhase,
        timestamp: Date.now()
      });

      return true;
    });
  }

  /**
   * Submit an independent review.
   */
  static async submitReview(proposalId: string, reviewerId: string, rating: "approve" | "reject" | "changes_requested", comment: string): Promise<boolean> {
    const docRef = db.collection("change_proposals").doc(proposalId);
    
    return await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) {
        throw new Error("Proposal not found");
      }
      const data = snap.data() as ChangeProposal;

      // Self-rating prevention
      if (data.authorId === reviewerId) {
         throw new Error("Fraud Prevention Rule: You cannot approve or review your own change proposal.");
      }

      const reviews = data.reviews || [];
      // Remove any existing review from this user to replace it
      const filteredReviews = reviews.filter((r: Review) => r.reviewerId !== reviewerId);
      
      const newReview: Review = {
        reviewerId,
        rating,
        comment,
        timestamp: Date.now()
      };
      
      filteredReviews.push(newReview);

      transaction.update(docRef, { reviews: filteredReviews, updatedAt: Date.now() });
      return true;
    });
  }
}
