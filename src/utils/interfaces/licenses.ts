import { IMetadata } from './general/general';

export enum LICENSE_STATE {
  draft = 'draft',
  active = 'active',
  returned = 'returned',
  expired = 'expired',
  revoked = 'revoked',
  cancelled = 'cancelled',
}

export interface ILicenseList {
  metadata: IMetadata;
  items: ILicense[];
}

export interface ILicenseEdit {
  state: string;
  duration: string;
}

export interface ILicenseNew {
  entry_id: string;
  state: string;
  duration: string;
  starts_at?: string;
}

export interface ILicense {
  id: string;
  user_id: string;
  entry_id: string;
  state: LICENSE_STATE;
  url: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
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
  };
}

export interface ILicensePayload {
  state: LICENSE_STATE;
  duration: string;
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
