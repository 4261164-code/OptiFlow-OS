export interface User {
  id: string;
  role: 'admin' | 'analyst' | 'creator';
  email: string;
  profile: any;
}

export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: any;
  retries: number;
  created_at: Date;
}

export interface Content {
  id: string;
  status: 'draft' | 'published' | 'archived';
  wp_id?: string;
  metadata: any;
  performance_stats: any;
}

export interface Click {
  id: string;
  offer_id: string;
  timestamp: Date;
  source: string;
  click_id: string;
  s1?: string;
}

export interface Conversion {
  id: string;
  click_id: string;
  revenue: number;
  timestamp: Date;
  status: 'pending' | 'verified';
}

export interface Offer {
  id: string;
  network_id: string;
  status: 'active' | 'paused';
  epc: number;
  performance: any;
}

export interface EventLog {
  id: string;
  event_type: string;
  payload: any;
  timestamp: Date;
}
