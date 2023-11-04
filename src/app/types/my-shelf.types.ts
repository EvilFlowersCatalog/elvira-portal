import { Metadata } from './general.types';
import { EntryDetail } from './entry.types';

export interface MyShelfList {
  items: MyShelf[];
  metadata: Metadata;
}

export interface MyShelf {
  id: string;
  entry: EntryDetail;
  created_at: string;
  updated_at: string;
}

export interface MyShelfNew {
  entry_id: string;
}

export interface MyShelfPostResponse {
  response: MyShelf;
}

export interface MyShelfQuery {
  page: number;
  limit: number;
  title: string;
  order_by: string;
}
