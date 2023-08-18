export interface AcquisitionDetail {
  response: {
    relation: string;
    mime: string;
    url: string;
    id: string;
    content: string;
  };
}

export interface UserAcquisition {
  acquisition_id: string;
  type: string;
}

export interface UserAcquisitionId {
  response: {
    id: string;
  }
}

export interface UserAcquisitionData {
  response: {
    data: string;
  }
}

export interface EntryAcquisition {
  relation: string;
  mime: string;
  url: string;
  id: string;
  content: string;
}