/** `EncryptedContent.status` on the catalog (Readium LCP). */
export type EncryptionJobStatus = 'pending' | 'completed' | 'failed' | 'registered';

/**
 * One publication's encryption job as a row shows it: the job status, or why there is none.
 * `off` — Readium LCP is switched off; `no_file` — no PDF/EPUB to encrypt; `not_started` — no job yet.
 */
export type EncryptionState = EncryptionJobStatus | 'off' | 'no_file' | 'not_started';

export interface IEncryptionJob {
  status: EncryptionJobStatus;
  lcp_content_id: string;
  ready_for_licensing: boolean;
  encrypted_at: string | null;
  registered_at: string | null;
  error_message: string | null;
}

/**
 * `GET /readium/v1/entries/{id}/encryption`. The backend looks only at the entry's
 * first PDF/EPUB acquisition, so this describes one job per publication.
 */
export interface IEntryEncryption {
  readium_enabled: boolean;
  has_acquisition?: boolean;
  encryption?: IEncryptionJob | null;
  message?: string;
}

export const encryptionState = (data?: IEntryEncryption): EncryptionState | undefined => {
  if (!data) return undefined;
  if (!data.readium_enabled) return 'off';
  if (data.has_acquisition === false) return 'no_file';
  return data.encryption?.status ?? 'not_started';
};
