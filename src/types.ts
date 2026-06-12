export interface RevenueMetric {
  id: string; // derived from keyword or date
  keyword: string;
  clicks: number;
  conversions: number;
  revenue: number;
  epc: number;
  ctr: number;
  roi: number;
  date: string;
  userId: string;
  createdAt: number;
}

export interface AgentLog {
  id: string;
  agentType: string;
  jobId?: string;
  status: 'success' | 'warn' | 'error' | 'info' | 'started' | 'running' | 'completed' | 'failed' | 'retrying';
  message: string;
  timestamp: number;
  tokensAssigned?: number;
  tokensUsed?: number;
  executionDurationMs?: number;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export type JobStatus = 'pending' | 'running' | 'research' | 'writing' | 'seo_clustering' | 'pinterest' | 'monetization' | 'completed' | 'error';

export interface TopicCluster {
  id: string; // clusterId
  title: string;
  keyword: string;
  status: 'planning' | 'generating' | 'linking' | 'completed' | 'error';
  totalNodes: number;
  completedNodes: number;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ClusterNode {
  id: string; // nodeId
  clusterId: string;
  keyword: string;
  title: string;
  searchIntent: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  articleId?: string; // Links to the generated article
  userId: string;
  isPillar: boolean;
  createdAt: number;
}

export interface ClusterLink {
  sourceNode: string;
  targetNode: string;
  anchorText: string;
  confidence: number;
}

export interface PillarPage {
  id: string; // pillarId
  clusterId: string;
  title: string;
  slug: string;
  articleId: string;
  userId: string;
}

export interface ClusterJob {
  id: string; // jobId
  clusterId: string;
  jobType: string;
  status: string;
  progress: number;
  logs: string[];
}

export interface Job {
  id: string;
  keyword: string;
  status: JobStatus;
  userId: string;
  researchResult?: string;
  articleId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  keyword: string;
  jobId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  wordpressStatus?: 'idle' | 'publishing' | 'published' | 'error';
  wordpressUrl?: string;
  wordpressError?: string;
  telegramStatus?: 'idle' | 'publishing' | 'published' | 'error';
  telegramUrl?: string;
  telegramError?: string;
  twitterStatus?: 'idle' | 'publishing' | 'published' | 'error';
  twitterUrl?: string;
  twitterError?: string;
  twitterPostContent?: string;
  linkedinStatus?: 'idle' | 'publishing' | 'published' | 'error';
  linkedinUrl?: string;
  linkedinError?: string;
  linkedinPostContent?: string;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
  scheduledAt?: number | null;
  isScheduled?: boolean;
}

export interface Pin {
  id: string;
  title: string;
  description: string;
  concept: string;
  imageUrl?: string;
  articleId: string;
  jobId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  wordpressStatus?: 'idle' | 'publishing' | 'published' | 'error';
  wordpressUrl?: string;
  wordpressError?: string;
  telegramStatus?: 'idle' | 'publishing' | 'published' | 'error';
  telegramUrl?: string;
  telegramError?: string;
  pinterestStatus?: 'idle' | 'publishing' | 'published' | 'error';
  pinterestUrl?: string;
  pinterestError?: string;
  twitterStatus?: 'idle' | 'publishing' | 'published' | 'error';
  twitterUrl?: string;
  twitterError?: string;
  twitterPostContent?: string;
  linkedinStatus?: 'idle' | 'publishing' | 'published' | 'error';
  linkedinUrl?: string;
  linkedinError?: string;
  linkedinPostContent?: string;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
  scheduledAt?: number | null;
  isScheduled?: boolean;
}

export interface Offer {
  id: string;
  brand: string;
  keyword: string;
  link: string;
  anchor?: string;
  description?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export type NotificationType = 'milestone' | 'traffic' | 'error' | 'info';

export interface StrategicMemory {
  id: string;
  topic: string;
  insight: string;
  reliability: number; // 0-1 score
  sourceAgent?: string;
  userId: string;
  createdAt: number;
}

export interface CEOTarget {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'reached' | 'abandoned' | 'pivoted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    label: string;
    current: number;
    target: number;
    unit: string;
  }[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrganizationNode {
  id: string;
  name: string;
  role: string;
  type: 'agent' | 'human' | 'system';
  status: 'online' | 'offline' | 'busy' | 'terminated';
  efficiency: number;
  lastActive: number;
  userId: string;
}

export interface SavedKeyword {
  id: string;
  keyword: string;
  payloadJson: string;
  createdAt: number;
  userId: string;
  isTracked?: boolean;
  trendThresholdType?: 'volume' | 'cpc' | 'pinterestPotential' | 'seoPotential';
  trendThresholdValue?: number;
  isAlertTriggered?: boolean;
  updatedAt?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

