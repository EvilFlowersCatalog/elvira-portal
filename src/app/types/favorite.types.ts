import { Metadata } from './general.types';
import { EntryDetail } from './entry.types';

export interface FavoriteList {
  items: Favorite[];
  metadata: Metadata;
}

export interface Favorite {
  id: string;
  entry: EntryDetail;
  created_at: string;
  updated_at: string;
}

export interface FavoriteNew {
  entry_id: string;
}

export interface FavoritePostResponse {
  response: Favorite;
}

export interface FavoriteQuery {
  page: number;
  limit: number;
  title: string;
  order_by: string;
}
