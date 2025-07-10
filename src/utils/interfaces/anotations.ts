import { IMetadata } from './general/general';

export interface IAnotation {
  id: string;
  user_acquisition_id: string;
  title: string;
}

export interface ICreateAnotation {
  user_acquisition_id: string;
  title: string;
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
}

export interface IAnotationUpdate {
  title: string;
}
