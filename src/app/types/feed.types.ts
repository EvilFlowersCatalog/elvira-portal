import { Metadata } from './general.types';

export interface FeedsList {
  items: Feed[];
  metadata: Metadata;
}

export interface Feed {
  id: string;
  title: string;
  content: string;
  url_name: string;
  kind: string;
  parents?: string[];
  children?: string[];
}

export interface FeedDetail {
  response: {
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
  };
}

export interface FeedQuery {
  page: number;
  limit: number;
  parent_id?: string;
  title?: string;
  kind?: string;
  order_by: string;
}

export interface FeedNew {
  catalog_id: string;
  parents?: string[];
  title: string;
  url_name: string;
  content: string;
  kind: string;
}
