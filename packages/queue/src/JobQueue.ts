import { Layer3Execution, ActionPlan } from '../../../server/services/architectureLayers';
import { logger } from '../../../server/lib/logger';

export type JobState = 'queued' | 'processing' | 'retry' | 'failed' | 'completed';

export interface JobOptions {
  attempts?: number;
  idempotencyKey?: string;
  userId?: string;
}

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  opts: JobOptions;
  state: JobState;
  attemptsMade: number;
  error?: string;
  result?: any;
}

export type Processor<T = any> = (job: Job<T>) => Promise<any>;

/**
 * @deprecated WARNING: This is an IN-MEMORY queue. It is NOT durable and will lose jobs on server restart or container scale-down.
 * DO NOT use this for anything user-facing or revenue-related. Use the Firestore-backed OrchestrationEngine for durable work.
 */
export class JobQueue<T = any> {
  public name: string;
  private jobs: Map<string, Job<T>> = new Map();
  private processor?: Processor<T>;
  private processing: boolean = false;

  constructor(name: string) {
    this.name = name;
  }

  public async add(name: string, data: T, opts?: JobOptions): Promise<Job<T>> {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const job: Job<T> = {
      id,
      name,
      data,
      opts: opts || {},
      state: 'queued',
      attemptsMade: 0,
    };
    
    this.jobs.set(id, job);
    logger.info(`[JobQueue ${this.name}] Added job ${id}`);
    
    // Auto start processing if a processor is registered
    this.startProcessing();
    
    return job;
  }

  public process(processor: Processor<T>) {
    this.processor = processor;
    this.startProcessing();
  }

  private async startProcessing() {
    if (this.processing || !this.processor) return;
    this.processing = true;

    try {
      while (true) {
        const nextJob = this.getNextJob();
        if (!nextJob) break;

        await this.processJob(nextJob);
      }
    } finally {
      this.processing = false;
    }
  }

  private getNextJob(): Job<T> | undefined {
    for (const job of this.jobs.values()) {
      if (job.state === 'queued' || job.state === 'retry') {
        return job;
      }
    }
    return undefined;
  }

  private async processJob(job: Job<T>) {
    this.updateJobState(job.id, 'processing');
    job.attemptsMade++;

    logger.info(`[JobQueue ${this.name}] Processing job ${job.id} (Attempt ${job.attemptsMade})`);

    try {
      // Integrate with existing Layer3Execution for orchestration if required
      // If the processor returns an ActionPlan, we can route it through ExecutionEngine.
      // But we just await the processor for general flexibility.
      let result;
      if (this.processor) {
         result = await this.processor(job);
      }

      this.updateJobState(job.id, 'completed', { result });
      logger.info(`[JobQueue ${this.name}] Job ${job.id} completed successfully.`);
    } catch (err: any) {
      const maxAttempts = job.opts.attempts || 1;
      const errorMsg = err.message || String(err);

      if (job.attemptsMade < maxAttempts) {
        this.updateJobState(job.id, 'retry', { error: errorMsg });
        logger.warn(`[JobQueue ${this.name}] Job ${job.id} failed, will retry. Error: ${errorMsg}`);
      } else {
        this.updateJobState(job.id, 'failed', { error: errorMsg });
        logger.error(`[JobQueue ${this.name}] Job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${errorMsg}`);
      }
    }
  }

  private updateJobState(jobId: string, state: JobState, updates?: Partial<Job<T>>) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.state = state;
      if (updates) {
        Object.assign(job, updates);
      }
      this.jobs.set(jobId, job);
    }
  }

  public getJob(jobId: string): Job<T> | undefined {
    return this.jobs.get(jobId);
  }

  public getJobs(states?: JobState[]): Job<T>[] {
    const allJobs = Array.from(this.jobs.values());
    if (!states || states.length === 0) return allJobs;
    return allJobs.filter(job => states.includes(job.state));
  }
}
