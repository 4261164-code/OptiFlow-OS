import { db } from "../firebaseAdmin";
import { logger } from "../lib/logger";

export type AgentType = 
  | "ResearchAgent"
  | "ContentAgent"
  | "SEOAgent"
  | "MediaAgent"
  | "PublisherAgent"
  | "DistributionAgent"
  | "TrackingAgent"
  | "AnalyticsAgent"
  | "OptimizationAgent";

export type JobState = "pending" | "running" | "completed" | "failed" | "retry";

export type TriggerEvent = "new_keyword" | "scheduled_run" | "revenue_drop" | "high_performing_article";

export interface OrchestrationTask {
  task_id: string;
  job_id: string;
  agent: AgentType;
  input: any;
  output: any;
  status: JobState;
  error?: string;
  retry_count: number;
  created_at: number;
  updated_at: number;
  run_after?: number;
}

export interface OrchestrationJob {
  job_id: string;
  trigger_event: TriggerEvent;
  target_id: string;
  status: JobState;
  current_agentIndex: number;
  pipeline: AgentType[];
  context: any;
  created_at: number;
  updated_at: number;
  user_id: string;
}

export const STANDARD_PIPELINE: AgentType[] = [
  "ResearchAgent",
  "ContentAgent",
  "SEOAgent",
  "MediaAgent",
  "PublisherAgent",
  "DistributionAgent",
  "TrackingAgent",
  "AnalyticsAgent",
  "OptimizationAgent"
];
