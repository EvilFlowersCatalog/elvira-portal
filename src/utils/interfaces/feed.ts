import { IMetadata } from './general/general';

export interface IFeedsList {
  items: IFeed[];
  metadata: IMetadata;
}

export interface IFeed {
  id: string;
  title: string;
  content: string;
  url_name: string;
  kind: string;
  parents?: string[];
  children?: string[];
}

export interface IFeedDetail {
  id: string;
  title: string;
  content: string;
  url_name: string;
  kind: string;
  parents?: string[];
  children?: string[];
  creator_id: string;
  catalog_id: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface IFeedQuery {
  page?: number;
  limit?: number;
  paginate?: boolean;
  parentId?: string;
  title?: string;
  kind?: string;
  orderBy?: string;
}

export interface IFeedNew {
  catalog_id: string;
  parents?: string[];
  title: string;
  url_name: string;
  content: string;
  kind: string;
}
