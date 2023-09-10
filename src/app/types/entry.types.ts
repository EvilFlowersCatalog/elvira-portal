import { EntryAcquisition } from './acquisition.types';
import { EntryAuthor } from './author.types';
import { Feed } from './feed.types';
import { Metadata } from './general.types';

export interface EntriesList {
  items: Entry[];
  metadata: Metadata;
}

export interface Entry {
  id: string;
  title: string;
  author: EntryAuthor;
  language: EntryLanguage;
  popularity: number;
  category: EntryCategory;
  contributors: EntryAuthor[];
  creator_id: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
  shelf_record_id: string;
  thumbnail: string;
}

export interface EntryDetail {
  response: {
    id: string;
    creator_id: string;
    catalog_id: string;
    author: EntryAuthor;
    contributors: EntryAuthor[];
    category: EntryCategory;
    feeds: Feed[];
    language: EntryLanguage;
    title: string;
    created_at: string;
    updated_at: string;
    summary: string;
    content: string;
    identifiers: EntryIdentifiers;
    acquisitions: EntryAcquisition[];
    citation: string;
    img: string;
    shelf_record_id: string;
    thumbnail: string;
  };
}

export interface EntryQuery {
  page: number;
  limit: number;
  title?: string;
  feed_id?: string;
  author?: string;
  order_by?: string;
}

export interface EntryNew {
  title: string;
  author: EntryAuthor;
  feeds: string[];
  summary: string;
  language_code: string;
  contributors: EntryAuthor[];
  identifiers: EntryIdentifiers;
  citation: string;
  image: any;
}

export interface EntryCategory {
  id: string;
  term: string;
}

export interface EntryIdentifiers {
  doi: string;
  isbn: string;
}

export interface EntryLanguage {
  id: string;
  name: string;
  code: string;
}
