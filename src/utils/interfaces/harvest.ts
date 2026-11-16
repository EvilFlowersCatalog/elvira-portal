// IP-033/IP-034 (#51–#54): harvest sources, their mirror records, sync conflicts, external systems and the OAI-PMH
// status. Shapes follow EvilFlowersCatalog `develop` (apps/harvest/serializers.py, apps/oai/views.py), read 2026-11-16.
import { IJsonSchema } from './contentPolicy';

export type HarvestMode = 'link_only' | 'enrich' | 'create' | 'sync';
export const HARVEST_MODES: HarvestMode[] = ['link_only', 'enrich', 'create', 'sync'];

export type FieldPolicy = 'fill_empty' | 'overwrite' | 'ignore';
export const FIELD_POLICIES: FieldPolicy[] = ['fill_empty', 'overwrite', 'ignore'];

/** `apps.harvest.models.POLICY_FIELDS`: the entry fields a harvest may write. */
export const POLICY_FIELDS = [
  'title',
  'authors',
  'publisher',
  'published_at',
  'language',
  'summary',
  'edition',
  'page_count',
  'identifiers',
  'subjects',
  'links',
] as const;
export type PolicyField = (typeof POLICY_FIELDS)[number];

/** The catalog's default when a field is absent from `field_policy` (`POLICY_DEFAULTS`): links are opt-in. */
export const policyDefault = (field: string): FieldPolicy => (field === 'links' ? 'ignore' : 'fill_empty');

export type HarvestRecordStatus =
  | 'created'
  | 'matched'
  | 'enriched'
  | 'ambiguous'
  | 'unmatched'
  | 'failed'
  | 'deleted'
  | 'skipped';

/** Tab order of the records browser; after a dry run the two a librarian checks come first. */
export const RECORD_STATUSES: HarvestRecordStatus[] = ['created', 'matched', 'enriched', 'ambiguous', 'unmatched', 'failed', 'deleted', 'skipped'];
export const DRY_RUN_RECORD_STATUSES: HarvestRecordStatus[] = ['ambiguous', 'unmatched', 'created', 'matched', 'enriched', 'failed', 'deleted', 'skipped'];

export type SyncState = 'in_sync' | 'pending' | 'conflict' | 'error';

export type ConnectorCapability = 'read' | 'write' | 'validate' | 'link';

/** `GET /api/v1/harvest/connectors`. */
export interface IHarvestConnector {
  name: string;
  title: string;
  description: string;
  capabilities: ConnectorCapability[] | string[];
  config_schema: IJsonSchema | null;
  needs_base_url: boolean;
  needs_upload: boolean;
  runnable: boolean;
  /** Identifier keys the connector owns (`dataverse_pid`); requested in EvilFlowersCatalog#210, used when present. */
  system_keys?: string[];
}

/** Counters of a run: the finished job's `result` and the source's `last_report`. */
export interface IHarvestReport {
  seen?: number;
  created?: number;
  enriched?: number;
  matched?: number;
  unmatched?: number;
  ambiguous?: number;
  skipped?: number;
  failed?: number;
  deleted?: number;
  unchanged?: number;
  dry_run?: boolean;
  full?: boolean;
  cursor?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  [key: string]: unknown;
}

export const REPORT_COUNTERS = [
  'seen',
  'created',
  'matched',
  'enriched',
  'ambiguous',
  'unmatched',
  'unchanged',
  'skipped',
  'failed',
  'deleted',
] as const;

export interface IHarvestSource {
  id: string;
  slug: string;
  name: string;
  adapter: string;
  config: Record<string, unknown>;
  base_url: string | null;
  metadata_prefix: string;
  set_spec: string | null;
  system_key: string;
  target_catalog_id: string;
  mode: HarvestMode;
  field_policy: Partial<Record<string, FieldPolicy>>;
  /** Five-field cron; empty: manual runs only. */
  schedule: string;
  enabled: boolean;
  oai_reexpose: boolean;
  cursor: string | null;
  has_upload: boolean;
  last_run_at: string | null;
  last_report: IHarvestReport | null;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

/** The detail endpoint adds the record counts per status. */
export interface IHarvestSourceDetail extends IHarvestSource {
  record_counts: Partial<Record<HarvestRecordStatus, number>>;
  dry_run_counts: Partial<Record<HarvestRecordStatus, number>>;
}

/** Body of `POST /api/v1/harvest/sources` and `PUT …/{id}`; the required fields are sent every time. */
export interface IHarvestSourcePayload {
  slug: string;
  name: string;
  adapter: string;
  system_key: string;
  target_catalog_id: string;
  base_url?: string | null;
  metadata_prefix?: string;
  set_spec?: string | null;
  mode?: HarvestMode;
  field_policy?: Partial<Record<string, FieldPolicy>>;
  schedule?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  oai_reexpose?: boolean;
  cursor?: string | null;
}

export interface IHarvestSourceQuery {
  page?: number;
  limit?: number;
  target_catalog_id?: string;
  adapter?: string;
  enabled?: boolean;
  query?: string;
  order_by?: string;
}

/** `SourceRecord.as_dict()`: what the source said about one record. */
export interface ISourceRecord {
  record_id?: string;
  title?: string;
  subtitle?: string | null;
  authors?: { surname: string; name?: string }[];
  identifiers?: Record<string, string>;
  other_isbns?: string[];
  language?: string | null;
  publisher?: string | null;
  published?: string | null;
  edition?: string | null;
  series?: string | null;
  series_number?: string | null;
  page_count?: number | null;
  summary?: string | null;
  subjects?: { term: string; scheme?: string | null; label?: string | null }[];
  licence_url?: string | null;
  licence_name?: string | null;
  links?: string[];
  deleted?: boolean;
  datestamp?: string | null;
  extra?: Record<string, unknown>;
  version?: string | null;
  [key: string]: unknown;
}

export interface IHarvestRecord {
  id: string;
  source_id: string;
  record_id: string;
  datestamp: string | null;
  deleted: boolean;
  status: HarvestRecordStatus;
  matched_on: string | null;
  message: string | null;
  dry_run: boolean;
  entry_id: string | null;
  source_record: ISourceRecord;
  sync_state: SyncState | null;
  remote_version: string | null;
  local_version: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IHarvestRecordQuery {
  page?: number;
  limit?: number;
  status?: HarvestRecordStatus[];
  dry_run?: boolean;
  query?: string;
}

/**
 * `POST …/{id}/test`. OAI-PMH answers `identify` with the protocol's fields and formats/sets as objects; other
 * connectors (Dataverse) answer with their own keys and plain strings, so everything here is rendered generically.
 */
export interface IHarvestProbe {
  identify: Record<string, unknown> | null;
  metadata_formats: (Record<string, string | null> | string)[];
  sets: (Record<string, string | null> | string)[];
  sample: ISourceRecord | null;
  errors: string[];
}

/** `GET /api/v1/external-systems`. */
export interface IExternalSystem {
  key: string;
  name: string;
  kind: string;
  marc_org_code: string | null;
  /** `{record_id}` is replaced by the identifier's value. */
  record_url_template: string | null;
}

export type ConflictValue = string | number | boolean | null | ConflictValue[] | { [key: string]: ConflictValue };

/** `GET /api/v1/harvest/conflicts`. */
export interface IHarvestConflict {
  id: string;
  source_id: string;
  /** The harvest record's uuid, not the remote record id. */
  record_id: string;
  entry_id: string;
  field: string;
  local_value: ConflictValue;
  remote_value: ConflictValue;
  local_at: string | null;
  remote_at: string | null;
  winner: 'local' | 'remote';
  acknowledged: boolean;
  acknowledged_by_id: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface IHarvestConflictQuery {
  page?: number;
  limit?: number;
  source_id?: string;
  entry_id?: string;
  acknowledged?: boolean;
}

/** One linked system of an entry, `GET /api/v1/entries/{id}/sync`. */
export interface IEntrySyncSource {
  source_id: string;
  slug: string;
  name: string;
  adapter: string;
  mode: HarvestMode | string;
  record_id: string;
  record_url: string | null;
  sync_state: SyncState | null;
  last_synced_at: string | null;
  remote_version: string | null;
  local_version: string | null;
  message: string | null;
  open_conflicts: number;
}

/** `GET /api/v1/oai/status`. */
export interface IOaiStatus {
  enabled: boolean;
  base_url: string;
  repository_identifier: string;
  live: number;
  deleted: number;
  earliest_datestamp: string | null;
  last_datestamp: string | null;
}

/** Bibliographic identifier keys the catalog accepts besides one key per external system (IP-033 Q8). */
export const BIBLIOGRAPHIC_IDENTIFIER_KEYS = ['isbn', 'issn', 'ccnb', 'doi', 'google', 'dataverse_pid', 'dataverse_dataset_id'] as const;
