import { IEntryAcquisition } from './acquisition';
import { IEntryAuthor } from './author';
import { ICategory } from './category';
import { IFeed } from './feed';
import { IConfig, IMetadata } from './general/general';
import { ILanguage } from './language';

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
}

export interface IEntryDetail {
  response: {
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
  };
}

export interface IEntryQuery {
  page: number;
  limit: number;
  title?: string;
  categoryId?: string;
  feedId?: string;
  authors?: string;
  publishedAtGte?: string;
  publishedAtLte?: string;
  orderBy?: string;
  query?: string;
  config__readium_enabled?: boolean;
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
  response: {
    title: string;
    publisher: string;
    doi: string;
    authors: IEntryAuthor[];
    year: string;
    language: string;
    bibtex: string;
  };
}
