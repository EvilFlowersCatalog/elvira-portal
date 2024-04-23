import { IMetadata } from './general/general';

export interface IAuthorsList {
  items: IAuthor[];
  metadata: IMetadata;
}

export interface IAuthor {
  id: string;
  name: string;
  surname: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
}

export interface IEntryAuthor {
  id?: string;
  name: string;
  surname: string;
}
