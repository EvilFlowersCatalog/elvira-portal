// Content policies and instance settings (EvilFlowersCatalog#174, #20 — catalog 05cf002; portal elvira-portal#47).
// Shapes follow `apps/content/views.py`, `apps/content/services.py` and `apps/api/views/instance_settings.py`.

/** A JSON Schema node, as far as the form renderer reads it. */
export interface IJsonSchema {
  $ref?: string;
  $defs?: Record<string, IJsonSchema>;
  definitions?: Record<string, IJsonSchema>;
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, IJsonSchema>;
  required?: string[];
  additionalProperties?: boolean | IJsonSchema;
  items?: IJsonSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  oneOf?: IJsonSchema[];
  anyOf?: IJsonSchema[];
  format?: string;
}

/** The policy document; `key` and `title` live inside it (the schema requires both). */
export type PolicyDocument = Record<string, unknown> & { key?: string; title?: string };

/** `services.policy_payload`: a policy at one version. */
export interface IContentPolicy {
  key: string;
  version: number;
  /** `key@version`. */
  ref: string;
  title: string;
  /** Version 0: the built-in `parity`, not stored yet. */
  builtin: boolean;
  document: PolicyDocument;
  /** On PUT: false when the document was identical and nothing was written. */
  changed?: boolean;
}

/** `GET /content-policies/{key}/versions`: newest first, without documents (`?version=N` fetches one). */
export interface IContentPolicyVersion {
  key: string;
  version: number;
  ref: string;
  title: string;
  updated_by: string | null;
  created_at: string | null;
}

/** One cap that lowered the tier on the way to the final one. */
export interface IExplainCap {
  cap: string;
  tier: string;
}

/** `POST /content-policies/explain` → `Disclosure.explain()` plus `user_id` and `surface`. */
export interface IExplainResult {
  tier: string | null;
  /** `open`, `loan`, `past_loan` or `none`. */
  basis: string | null;
  reason: string | null;
  how_to_unlock: unknown;
  /** `policy:key@version`. */
  policy: string;
  entry_id: string;
  visible: boolean;
  /** Where the policy came from: entry, catalog, instance default, built-in. */
  policy_source: string | null;
  lcp: boolean | null;
  inside_ip: boolean | null;
  processor: string | null;
  caps: IExplainCap[];
  budget: unknown;
  user_id: string;
  surface: string;
}

export interface IExplainRequest {
  entry_id: string;
  user_id?: string;
  surface?: string;
  processor?: 'local' | 'external';
  /** What another (stored) policy would decide, without assigning it. */
  policy?: string;
}

/** `POST /content-policies/{key|inherit}/assign` → what changed. */
export interface IAssignResult {
  policy: string | null;
  catalog: { id: string; previous: string | null; changed: boolean } | null;
  entries: { id: string; previous: string | null; changed: boolean }[];
}

/** Where a setting's effective value comes from. */
export type SettingSource = 'stored' | 'setting' | 'default';

/** `settings_store.describe`: one declared key with its effective value. */
export interface ISetting {
  key: string;
  schema: IJsonSchema;
  description?: string;
  default: unknown;
  /** The Django setting (`EVILFLOWERS_*`) it falls back to, if any. */
  fallback?: string | null;
  permission?: string | null;
  /** Null for a secret. */
  value: unknown;
  source: SettingSource;
}
