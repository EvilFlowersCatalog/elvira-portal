// AI processing (IP-018 extraction) of a publication, as the catalog reports it to managers:
// GET /api/v1/entries/{id}/extraction and its /regions and /paragraphs.

export type ExtractionRunStatus = 'queued' | 'running' | 'done' | 'failed';
/** `none` = has a PDF that was never queued; `unsupported` = nothing the pipeline can read. */
export type ExtractionEntryStatus = ExtractionRunStatus | 'none' | 'unsupported';
export type RegionKind = 'figure' | 'table' | 'equation';

export interface IExtractionRunStats {
  figures: number;
  tables: number;
  equations: number;
  with_image: number;
  with_printed_caption: number;
  with_description: number;
  pages_with_regions: number;
  paragraphs: number;
  paragraphs_embedded: number;
  sentences: number;
  sections: number;
  links_next: number;
  links_similar: number;
  characters: number;
  has_embedding: boolean;
}

/**
 * A run's jobs of one kind (EvilFlowersCatalog#150). With per-batch dispatch a kind has one
 * job per layout batch (`equations:0009-0016`), so a big book holds hundreds of jobs.
 */
export interface IExtractionJobGroup {
  kind: string;
  total: number;
  done: number;
  pending: number;
  failed: number;
  /** First and last page of the kind's pending batches (gaps included); null when none pend or the kind is not batched. */
  pending_pages: [number, number] | null;
}

export type ExtractionJobStatus = 'pending' | 'done' | 'failed';

export interface IExtractionRun {
  id: string;
  pipeline_version: number;
  status: ExtractionRunStatus;
  is_active: boolean;
  page_count: number | null;
  /** `{job: pending | done | failed}`; a batched job is named `kind:first-last` (pages). */
  jobs: Record<string, ExtractionJobStatus>;
  /** `jobs` grouped by kind, sorted by kind; absent on catalogs before #150. */
  job_groups?: IExtractionJobGroup[];
  provenance: Record<string, unknown>;
  error: string | null;
  storage_dir: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  /** Seconds. */
  duration: number | null;
  stats: IExtractionRunStats | null;
}

export interface IExtractionTask {
  task_id: string;
  queue: string;
  waiting: boolean | null;
  position: number | null;
}

export interface IAcquisitionExtraction {
  id: string;
  relation: string | null;
  mime: string;
  name: string | null;
  size: number | null;
  extractable: boolean;
  reason: 'not_pdf' | 'external' | 'no_file' | null;
  status: ExtractionRunStatus | 'none';
  available: boolean;
  outdated: boolean;
  runs: IExtractionRun[];
  task: IExtractionTask | null;
}

export interface IQueueDepth {
  service: string;
  queue: string;
  waiting: number | null;
}

export interface IEntryHeadingLite {
  level: number;
  title: string;
  page: number;
}

export interface IEntryExtraction {
  entry_id: string;
  enabled: boolean;
  pipeline_version: number;
  status: ExtractionEntryStatus;
  acquisitions: IAcquisitionExtraction[];
  queues: IQueueDepth[];
  page_count: number | null;
  table_of_contents: IEntryHeadingLite[] | null;
}

export interface IExtractionRegion {
  id: string;
  run_id: string;
  kind: RegionKind;
  page: number;
  seq: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  caption: string | null;
  printed_caption: string | null;
  description: string | null;
  category: string | null;
  markdown: string | null;
  latex: string | null;
  provenance: Record<string, unknown>;
  image_path: string | null;
  /** Carries the access token once the hook has processed it. */
  image_url: string | null;
}

export interface IExtractionParagraph {
  id: string;
  page: number;
  seq: number;
  section: string | null;
  text: string;
  sentences: number;
  embedded: boolean;
  similar: number;
}

export interface IExtractionParagraphs {
  run_id: string | null;
  items: IExtractionParagraph[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
