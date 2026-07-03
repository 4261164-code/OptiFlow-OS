import { MaxBountyAuth } from "../integrations/maxbounty/auth";
import { MaxBountyCampaigns } from "../integrations/maxbounty/campaigns";
import { MaxBountyTracking } from "../integrations/maxbounty/tracking";
import { MaxBountyPostbacks } from "../integrations/maxbounty/postbacks";

export class MaxBountyConnector {
  constructor(private userId: string) {}

  async getAuth() {
    return await MaxBountyAuth.getCredentials(this.userId);
  }

  async getCampaigns(endpoint: "top" | "trending" | "popular" | "suggested" = "top") {
    const creds = await this.getAuth();
    const campaignsService = new MaxBountyCampaigns(creds?.apiToken || "unauthenticated_token");
    return await campaignsService.fetchFromNetwork(endpoint);
  }
  
  async syncCampaigns() {
    const creds = await this.getAuth();
    const campaignsService = new MaxBountyCampaigns(creds?.apiToken || "unauthenticated_token");
    return await campaignsService.syncToDb(this.userId);
  }

  async createTrackingLink(params: {
    campaignId: string;
    networkCampaignId: number;
    sub1?: string;
    sub2?: string;
    sub3?: string;
    sub4?: string;
    sub5?: string;
  }) {
    const creds = await this.getAuth();
    if (!creds) throw new Error("Not authenticated");
    return await MaxBountyTracking.createTrackingLink({
        ...params,
        affiliateId: creds.id, // Assuming this is the affiliateId needed
        userId: this.userId
    });
  }
}
