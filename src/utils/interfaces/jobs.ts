// Background jobs as the catalog serves them since IP-031 rev. 2: `/api/v1/jobs` (administrators only).
// A job is declared (spec, desired_state, generation) and observed (state); a run is one Celery task.

export type JobState = 'pending' | 'blocked' | 'queued' | 'running' | 'cancelling' | 'succeeded' | 'failed' | 'cancelled';
export type JobDesiredState = 'completed' | 'cancelled';
export type JobRunStatus =
  | 'queued'
  | 'received'
  | 'started'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'revoked'
  | 'rejected'
  | 'lost';

export const JOB_STATES: JobState[] = ['pending', 'blocked', 'queued', 'running', 'cancelling', 'succeeded', 'failed', 'cancelled'];
/** States a job is still on its way in: cancelling it makes sense, applying it again changes nothing. */
export const ACTIVE_JOB_STATES: JobState[] = ['pending', 'blocked', 'queued', 'running'];
export const ACTIVE_RUN_STATUSES: JobRunStatus[] = ['queued', 'received', 'started', 'retrying'];

export interface IJobRun {
  /** The Celery task id. */
  id: string;
  job_id: string | null;
  /** Celery task name, e.g. `evilflowers_text_worker.paragraphs`. */
  name: string;
  kind: string | null;
  status: JobRunStatus;
  parent_id: string | null;
  queue: string | null;
  worker: string | null;
  attempts: number;
  error: string | null;
  /** Seconds. */
  runtime: number | null;
  trace_id: string | null;
  created_at: string;
  sent_at: string | null;
  received_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  reported_at: string | null;
}

/** `detail.extraction_run.jobs`: the run's jobs per kind, `{figures: {done: 2, pending: 1}}`. */
export type JobStepCounts = Partial<Record<'pending' | 'done' | 'failed', number>>;

export interface IJob {
  id: string;
  kind: string;
  /** `app_label.model`, e.g. `core.acquisition`; null for subjectless kinds (maintenance). */
  subject_type: string | null;
  subject_id: string | null;
  catalog_id: string | null;
  entry_id: string | null;
  spec: Record<string, unknown>;
  desired_state: JobDesiredState;
  state: JobState;
  /** Queued for longer than EVILFLOWERS_JOBS_STALE_MINUTES. */
  stale: boolean;
  /** Why the job is blocked or failed. */
  reason: string | null;
  generation: number;
  observed_generation: number;
  /** Runs of the current generation. */
  attempts: number;
  /** What the provider observed in the domain (`extraction_run`, `encryption`, `post_process` …). */
  detail: {
    extraction_run?: {
      id: string;
      status: string;
      attempt: number;
      is_active: boolean;
      jobs: Record<string, JobStepCounts>;
      started_at: string | null;
      finished_at: string | null;
    };
    [key: string]: unknown;
  };
  current_run: IJobRun | null;
  /** The job whose outcome declared this one. */
  cause_id: string | null;
  requested_by_id: string | null;
  created_at: string;
  updated_at: string;
  last_transition_at: string | null;
}

export interface IJobEvent {
  type: string;
  timestamp: string;
  hostname: string | null;
  data: Record<string, unknown>;
}

export interface IJobDetail extends IJob {
  /** The job's own runs (its kind's task), newest first, at most 20. */
  runs: IJobRun[];
  /** Every run of the job, follow-up tasks too, counted per task name and status. */
  run_counts: { name: string; status: JobRunStatus; count: number }[];
  /** Transitions, newest last (at most 100). */
  events: IJobEvent[];
  /** Jobs this job's outcome declared. */
  consequences: IJob[];
}

export interface IJobKind {
  kind: string;
  title: string;
  description: string;
  task: string;
  subject_type: string | null;
  /** False: run-only kind (recorded, never declared). */
  keyed: boolean;
  reports: boolean;
  terminate_safe: boolean;
  max_attempts: number;
  spec_schema: { properties?: Record<string, { type?: string; default?: unknown; title?: string }>; description?: string };
}

export interface IJobSummaryRow {
  kind: string;
  states: Partial<Record<JobState, number>>;
  stale: number;
}

/** `POST /api/v1/jobs?dry_run=true`: what an apply would do; nothing stored or sent. */
export interface IJobPlan {
  kind: string;
  subject_id: string | null;
  spec: Record<string, unknown>;
  outcome: 'would-run' | 'would-block' | 'refused';
  reason: string | null;
  preview: Record<string, unknown>;
  job: IJob | null;
}

export interface IJobQuery {
  kind?: string;
  state?: string;
  stale?: boolean;
  entry_id?: string;
  catalog_id?: string;
  subject_type?: string;
  subject_id?: string;
  query?: string;
  page?: number;
  limit?: number;
  order_by?: string;
}

export interface IJobRunQuery {
  job_id?: string;
  kind?: string;
  status?: string;
  name?: string;
  without_job?: boolean;
  entry_id?: string;
  page?: number;
  limit?: number;
  order_by?: string;
}

export interface IJobApply {
  kind: string;
  subject_id?: string | null;
  spec?: Record<string, unknown>;
  desired_state?: JobDesiredState;
}
