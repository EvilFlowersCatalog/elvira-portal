// Content policies and settings (EvilFlowersCatalog#174, #20; portal elvira-portal#47).
// The catalog side is not implemented yet: these shapes follow the issues, and docs/content-policies-admin.md
// lists every assumption so the backend can confirm or correct it.

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
  oneOf?: IJsonSchema[];
  anyOf?: IJsonSchema[];
  format?: string;
}

export type PolicyDocument = Record<string, unknown>;

/** Where a policy is used: the instance default, catalogs, and how many entries pick it themselves. */
export interface IPolicyAssignment {
  default?: boolean;
  catalogs?: { id: string; title: string }[];
  entries?: number;
}

export interface IContentPolicy {
  key: string;
  title: string;
  version: number;
  document?: PolicyDocument;
  updated_by?: { id: string; username?: string } | string | null;
  created_at?: string;
  updated_at?: string;
  assigned?: IPolicyAssignment | null;
}

export interface IContentPolicyVersion {
  version: number;
  title: string;
  document: PolicyDocument;
  updated_by?: { id: string; username?: string } | string | null;
  created_at: string;
}

/** One cap the explain walk applied (or skipped) on the way to the final tier. */
export interface IExplainCap {
  cap: string;
  /** The cap's value in the policy (a tier, or an object such as `processor`). */
  value?: unknown;
  /** True when the cap lowered the tier. */
  applied: boolean;
  /** The tier after this cap. */
  tier?: string;
  reason?: string;
}

export interface IExplainResult {
  /** `open`, `loan`, `past_loan` or `none`. */
  basis: string;
  /** `policy:key@version`. */
  policy: string;
  /** The tier the basis grants before caps. */
  base_tier?: string;
  caps: IExplainCap[];
  tier: string;
}

export interface IExplainRequest {
  entry_id: string;
  user_id?: string;
  surface?: string;
  processor?: 'local' | 'external';
  /** An unsaved document to explain against instead of the stored policy (preview before saving). */
  document?: PolicyDocument;
  policy?: string;
}

/** Where a setting's current value comes from. */
export type SettingSource = 'db' | 'env' | 'default';

/** One key of the settings registry with its current value (`GET /api/v1/settings`). */
export interface ISetting {
  key: string;
  /** Registry type: `string`, `text`, `integer`, `number`, `boolean`, `json`, or a JSON Schema in `schema`. */
  type: string;
  value: unknown;
  default: unknown;
  source: SettingSource;
  title?: string;
  description?: string;
  /** Allowed values, rendered as a select. */
  choices?: unknown[];
  schema?: IJsonSchema;
  /** Write-only (e.g. a key): the value is never sent back. */
  secret?: boolean;
  /** Set only by the environment; read-only here. */
  readonly?: boolean;
}
