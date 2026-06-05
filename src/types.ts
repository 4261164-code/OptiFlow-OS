export type JobStatus = 'pending' | 'running' | 'research' | 'writing' | 'pinterest' | 'monetization' | 'completed' | 'error';

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

