import { IMetadata } from './general/general';

/** Viewer layer of an annotation (IP-018). */
export type AnotationKind = 'drawing' | 'highlight' | 'agent' | 'bookmarks';

export interface IAnotation {
  id: string;
  user_acquisition_id: string;
  title: string;
  kind?: AnotationKind;
}

export interface ICreateAnotation {
  user_acquisition_id: string;
  title: string;
  kind?: Exclude<AnotationKind, 'agent'>;
}

export interface IAnotationItemBody {
  annotation_id: string;
  page: number;
  content: any;
}

export interface IUpdateAnotation {
  title: string;
}

export interface IAnotationItem {
  id: string;
  annotation_id: string;
  page: number;
  content: any;
}

export interface ICreateAnotationItemResponse {
  id: string;
  content: any;
}

export interface IListAnitation {
  items: IAnotation[];
  metadata: IMetadata;
}

export interface IListAnitationItem {
  items: IAnotationItem[];
  metadata: IMetadata;
}

export interface IAnotationNew {
  user_acquisition_id: string;
  title: string;
  kind?: Exclude<AnotationKind, 'agent'>;
}

export interface IAnotationUpdate {
  title: string;
}
