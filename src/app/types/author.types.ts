import { Metadata } from "./general.types";

export interface AuthorsList {
  items: Author[];
  metadata: Metadata;
}

export interface Author {
  id: string;
  name: string;
  surname: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
}

export interface EntryAuthor {
  id?: string;
  name: string;
  surname: string;
}