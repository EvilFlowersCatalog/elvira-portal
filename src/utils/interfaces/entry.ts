import { IEntryAcquisition } from './acquisition';
import { IEntryAuthor } from './author';
import { IFeed } from './feed';
import { IMetadata } from './general/general';

export interface IEntriesList {
  items: IEntry[];
  metadata: IMetadata;
}

export interface IEntry {
  id: string;
  title: string;
  authors: IEntryAuthor[];
  language: IEntryLanguage;
  popularity: number;
  category: IEntryCategory;
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
    category: IEntryCategory;
    popularity: string;
    feeds: IFeed[];
    language: IEntryLanguage;
    title: string;
    year: string;
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
  feedId?: string;
  authors?: string;
  publishedAtGte?: string;
  publishedAtLte?: string;
  orderBy?: string;
}

export interface IEntryNew {
  title: string;
  authors: IEntryAuthor[];
  feeds: string[];
  summary: string;
  language_code: string;
  identifiers: IEntryIdentifiers;
  citation: string;
  year: string;
  publisher: string;
  image: any;
}

export interface IEntryNewForm {
  title: string;
  authors: IEntryAuthor[];
  feeds: {
    id: string;
    title: string;
  }[];
  summary: string;
  language_code: string;
  identifiers: IEntryIdentifiers;
  citation: string;
  year: string;
  publisher: string;
  image: File | null;
  pdf: File | null;
}

export interface IEntryCategory {
  id: string;
  term: string;
}

export interface IEntryIdentifiers {
  doi: string;
  isbn: string;
}

export interface IEntryLanguage {
  id: string;
  name: string;
  code: string;
}

export interface IEntryInfo {
  response: {
    title: string;
    publisher: string;
    doi: string;
    authorss: IEntryAuthor[];
    year: string;
    language: string;
    bibtex: string;
  };
}
