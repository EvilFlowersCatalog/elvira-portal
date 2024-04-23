export interface IAcquisitionDetail {
  response: {
    relation: string;
    mime: string;
    url: string;
    id: string;
    content: string;
  };
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
  response: {
    id: string;
    url: string;
  };
}

export interface IUserAcquisitionData {
  response: {
    data: string;
  };
}

export interface IEntryAcquisition {
  relation: string;
  mime: string;
  url: string;
  id: string;
  content: string;
}
