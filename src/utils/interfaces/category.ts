import { IMetadata } from './general/general';

export interface ICategory {
  id: string;
  term: string;
  catalog_id: string;
  label: string;
  scheme: string;
}

export interface ICategoryNew {
  term: string;
  catalog_id: string;
  label: string;
  scheme: string;
}

export interface ICategoryQuery {
  page: number;
  limit: number;
  query?: string;
  orderBy: string;
}

export interface IListCategory {
  items: ICategory[];
  metadata: IMetadata;
}
