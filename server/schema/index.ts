export interface ContentObject {
  id: string;
  title: string;
  keyword: string;
  body: string;
  seo_score: number;
  revenue_score: number;
  status: 'draft' | 'published' | 'failed';
  created_at: number;
}

export interface JobObject {
  job_id: string;
  type: 'content' | 'seo' | 'publish' | 'distribute';
  status: 'pending' | 'running' | 'done' | 'failed';
  payload: any;
  retry_count: number;
  created_at: number;
}

export interface ClickObject {
  click_id: string;
  content_id: string;
  offer_id: string;
  source: string;
  timestamp: number;
}

export interface ConversionObject {
  conversion_id: string;
  click_id: string;
  revenue: number;
  network: string;
  timestamp: number;
}

export interface OfferObject {
  offer_id: string;
  name: string;
  epc: number;
  conversion_rate: number;
  active: boolean;
}

export interface CreatorObject {
  creator_id: string;
  revenue: number;
  clicks: number;
  conversions: number;
}

export interface SystemEvent {
  event_id: string;
  type: 'keyword_discovered' | 'article_published' | 'traffic_spike' | 'revenue_drop' | 'high_epc_offer' | 'conversion_increase' | 'custom';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  processed_at?: number;
  log?: string[];
}
