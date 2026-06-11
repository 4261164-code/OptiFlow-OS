export interface AffiliateNetwork {
  id: string;
  name: string;
  apiBaseUrl: string;
  active: boolean;
  createdAt: number;
}

export interface NetworkCredentials {
  id: string; // usually same as network id or unified
  networkId: string;
  email: string;
  apiToken: string;
  tokenExpiry: number;
  userId: string;
  createdAt: number;
}

export interface MaxBountyCampaign {
  id: string; // network_campaign_id
  networkCampaignId: number;
  networkId: string;
  name: string;
  payout: number;
  conversionType: string;
  status: 'active' | 'paused' | 'expired' | string;
  countries: string[];
  trafficTypes: string[];
  epc: number;
  expiresAt: number | null;
  createdAt: number;
  score?: number; // Discovery score
}

export interface MaxBountyTrackingLink {
  id: string; // tracking link id
  campaignId: string;
  affiliateLink: string;
  sub1?: string;
  sub2?: string;
  sub3?: string;
  sub4?: string;
  sub5?: string;
  createdAt: number;
}

export interface MaxBountyPostbackPayload {
  transaction_id: string;
  payout: number;
  status: string;
  sub1?: string;
  sub2?: string;
  sub3?: string;
  sub4?: string;
  sub5?: string;
}

export interface DiscoveryEngineWeights {
  epcWeight: number; // default: 0.40
  payoutWeight: number; // default: 0.20
  trendWeight: number; // default: 0.20
  geoWeight: number; // default: 0.20
}
