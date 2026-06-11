import { db } from "../../firebaseAdmin";
import { MaxBountyTrackingLink } from "./types";

export class MaxBountyTracking {
  /**
   * Generates a fully-resolved MaxBounty tracking link with sub-ID encoding.
   * Format: https://trk.maxbounty.com/aff_c?offer_id={campaignId}&aff_id={affiliateId}&sub1={sub1}&sub2={sub2}...
   */
  static generateNetworkTrackingUrl(params: {
    campaignId: number;
    affiliateId: string;
    sub1?: string;
    sub2?: string;
    sub3?: string;
    sub4?: string;
    sub5?: string;
  }): string {
    const affiliateIdClean = params.affiliateId.replace("mb-aff-", "");
    const base = `https://trk.maxbounty.com/aff_c?offer_id=${params.campaignId}&aff_id=${affiliateIdClean}`;
    const queryParts: string[] = [];
    
    if (params.sub1) queryParts.push(`sub1=${encodeURIComponent(params.sub1)}`);
    if (params.sub2) queryParts.push(`sub2=${encodeURIComponent(params.sub2)}`);
    if (params.sub3) queryParts.push(`sub3=${encodeURIComponent(params.sub3)}`);
    if (params.sub4) queryParts.push(`sub4=${encodeURIComponent(params.sub4)}`);
    if (params.sub5) queryParts.push(`sub5=${encodeURIComponent(params.sub5)}`);

    return queryParts.length > 0 ? `${base}&${queryParts.join("&")}` : base;
  }

  /**
   * Generates tracking parameters and saves to tracking_links collection in Firestore.
   */
  static async createTrackingLink(params: {
    campaignId: string;
    networkCampaignId: number;
    affiliateId: string;
    sub1?: string;
    sub2?: string;
    sub3?: string;
    sub4?: string;
    sub5?: string;
    userId: string;
  }): Promise<MaxBountyTrackingLink> {
    const id = `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const trackingUrl = this.generateNetworkTrackingUrl({
      campaignId: params.networkCampaignId,
      affiliateId: params.affiliateId,
      sub1: params.sub1 || "affiliateos",
      sub2: params.sub2,
      sub3: params.sub3,
      sub4: params.sub4,
      sub5: params.sub5,
    });

    const docData: MaxBountyTrackingLink & { userId: string } = {
      id,
      campaignId: params.campaignId,
      affiliateLink: trackingUrl,
      sub1: params.sub1,
      sub2: params.sub2,
      sub3: params.sub3,
      sub4: params.sub4,
      sub5: params.sub5,
      createdAt: Date.now(),
      userId: params.userId,
    };

    await db.collection("tracking_links").doc(id).set(docData);
    console.log(`[MaxBountyTracking] Generated unique link: ${id} redirecting to ${trackingUrl}`);

    return docData;
  }
}
