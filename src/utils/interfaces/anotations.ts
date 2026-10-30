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

/** A line box of a text highlight, as page fractions (origin top-left). */
export interface IAnotationQuad {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface IAnotationItemBody {
  annotation_id: string;
  page: number;
  content: any;
  /** Text highlights only: the highlighted text and one box per line. */
  text?: string;
  quads?: IAnotationQuad[];
}

export interface IUpdateAnotation {
  title: string;
}

export interface IAnotationItem {
  id: string;
  annotation_id: string;
  page: number;
  content: any;
  text?: string | null;
  quads?: IAnotationQuad[] | null;
}

export interface ICreateAnotationItemResponse {
  id: string;
  content: any;
  page?: number;
  text?: string | null;
  quads?: IAnotationQuad[] | null;
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
