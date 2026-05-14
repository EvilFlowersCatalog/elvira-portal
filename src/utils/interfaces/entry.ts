import { IEntryAcquisition } from './acquisition';
import { IEntryAuthor } from './author';
import { ICategory } from './category';
import { IFeed } from './feed';
import { IConfig, IMetadata } from './general/general';
import { ILanguage } from './language';

export type LcpState = 'not_lcp' | 'available_now' | 'active_loan_for_user' | 'fully_borrowed' | 'available_in_days';

export interface IEntriesList {
  items: IEntry[];
  metadata: IMetadata;
}

export interface IEntry {
  id: string;
  title: string;
  authors: IEntryAuthor[];
  language_code?: string;
  popularity: number;
  categories: ICategory[];
  acquisitions: IEntryAcquisition[];
  summary: string;
  feeds: IFeed[];
  creator_id: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
  shelf_record_id: string;
  thumbnail: string;
  lcp_state: LcpState;
  available_slots: number;
  total_slots: number;
  active_count: number;
  over_saturated: boolean;
  next_available_at: string | null;
  user_active_license_id: string | null;
  queue_length: number;
  user_reservation_id: string | null;
  user_position: number | null;
}

export interface IEntryDetail {
  id: string;
  creator_id: string;
  catalog_id: string;
  authors: IEntryAuthor[];
  categories: ICategory[];
  popularity: string;
  feeds: IFeed[];
  language?: ILanguage;
  title: string;
  config: IConfig;
  published_at: string;
  publisher: string;
  created_at: string;
  updated_at: string;
  summary: string;
  content: string;
  identifiers: IEntryIdentifiers;
  acquisitions: IEntryAcquisition[];
  citation: string;
  shelf_record_id: string;
  thumbnail: string;
  lcp_state: LcpState;
  available_slots: number;
  total_slots: number;
  active_count: number;
  over_saturated: boolean;
  next_available_at: string | null;
  user_active_license_id: string | null;
  queue_length: number;
  user_reservation_id: string | null;
  user_position: number | null;
}

export interface IEntryQuery {
  page: number;
  limit: number;
  title?: string;
  /** Single category ID — current production API (category_id) */
  categoryId?: string;
  /** Single feed ID — current production API (feed_id) */
  feedId?: string;
  authors?: string;
  publishedAtGte?: string;
  publishedAtLte?: string;
  orderBy?: string;
  query?: string;
  config__readium_enabled?: boolean;
  languageCode?: string;
  /** Comma-separated category IDs — experimental multi-filter API (param name TBD) */
  categories?: string;
  /** Comma-separated feed IDs — experimental multi-filter API (param name TBD) */
  feeds?: string;
}

export interface IEntryNew {
  title: string;
  authors: IEntryAuthor[];
  feeds: string[];
  summary: string;
  language_code?: string;
  identifiers: IEntryIdentifiers;
  categories: ICategory[];
  config?: IConfig;
  citation: string;
  published_at?: string;
  publisher: string;
  image?: any;
}

export interface IEntryNewForm {
  title: string;
  authors: IEntryAuthor[];
  feeds: {
    id: string;
    title: string;
  }[];
  categories: ICategory[];
  summary: string;
  language_code?: string;
  identifiers: IEntryIdentifiers;
  config?: IConfig;
  citation?: string;
  published_at: string;
  publisher: string;
  thumbnail?: string;
}

export interface IEntryIdentifiers {
  doi: string;
  isbn: string;
}

export interface IEntryInfo {
  title: string;
  publisher: string;
  doi: string;
  authors: IEntryAuthor[];
  year: string;
  language: string;
  bibtex: string;
}
