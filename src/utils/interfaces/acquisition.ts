import { IMetadata } from './general/general';

export interface IAcquisitionDetail {
  relation: string;
  mime: string;
  url: string;
  id: string;
  content: string;
}

export interface IAcquisitionQuery {
  entry_id?: string;
  relation?: 'acquisition' | 'open-access';
  mime?: string;
}

export interface IAcquisition {
  id: string;
  relation: string;
  mime: string;
  url: string;
}

export interface IAcquisitionList {
  items: IAcquisition[];
  metadata: IMetadata;
}

export interface IUserAcquisition {
  acquisition_id: string;
  type: string;
}

export interface IUserAcquisitionShare {
  acquisition_id: string;
  type: string;
  range: string;
  expires_at: string;
}

export interface IUserAcquisitionResponse {
  id: string;
  url: string;
  /**
   * Owner only (EvilFlowersCatalog#214): a signed, reusable content URL (`?exp=&sig=`) that needs no
   * Authorization header, for range loading. Valid until `stream_url_expires_at` (6 h by default);
   * afterwards it answers 403 and a fresh one comes from GET /api/v1/user-acquisitions/<id>.
   */
  stream_url?: string | null;
  stream_url_expires_at?: string | null;
}

export interface IUserAcquisitionData {
  data: string;
}

export interface IEntryAcquisition {
  relation: string;
  mime: string;
  url: string;
  id: string;
  content: string;
}
