import { IMetadata } from './general/general';
import { IEntry } from './entry';

export interface IMyShelf {
  id: string;
  entry: IEntry;
  created_at: string;
  updated_at: string;
}

export interface IMyShelfList {
  items: IMyShelf[];
  metadata: IMetadata;
}

export interface IMyShelfNew {
  entry_id: string;
}

export interface IMyShelfPostResponse {
  response: IMyShelf;
}
