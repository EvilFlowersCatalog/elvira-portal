import { IMetadata } from './general/general';

export enum LICENSE_STATE {
  ready = 'ready',
  active = 'active',
  returned = 'returned',
  expired = 'expired',
  revoked = 'revoked',
  cancelled = 'cancelled',
}

export enum LICENSE_ACTION {
  active = 'active',
  returned = 'returned',
  renewed = 'renewed',
  revoked = 'revoked',
  cancelled = 'cancelled',
}

export interface ILicenseList {
  metadata: IMetadata;
  items: ILicense[];
}

export interface ILicenseEdit {
  action: LICENSE_ACTION;
  requested_end?: string;
}

export interface ILicenseNew {
  entry_id: string;
  state: LICENSE_STATE;
  duration: string;
  starts_at?: string;
}

export interface ILicense {
  id: string;
  user_id: string;
  entry_id: string;
  state: LICENSE_STATE;
  url?: string;
  download_url?: string;
  entry?: {
    id: string;
    title: string;
  };
  lcp_license_id?: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  renewal_count: number;
  renewals_remaining: number | null;
}

export interface ILicenseDetail {
  response: {
    id: string;
    user_id: string;
    entry_id: string;
    state: LICENSE_STATE;
    starts_at: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
    renewal_count: number;
    renewals_remaining: number | null;
  };
}

export interface ILicensePayload {
  action: LICENSE_ACTION;
  requested_end?: string;
}

export interface ILicenseQuery {
  page: number;
  limit: number;
  user_id?: string;
  entry_id?: string;
  state?: LICENSE_STATE;
  starts_at__gte?: string;
  starts_at__lte?: string;
  expires_at__gte?: string;
  expires_at__lte?: string;
}
