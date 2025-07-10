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
