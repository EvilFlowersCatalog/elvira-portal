import { IMetadata } from './general/general';

export interface ILanguage {
  id: string;
  name: string;
  alpha2: string;
  alpha3: string;
}

export interface ILanguageList {
  items: ILanguage;
  metadata: IMetadata;
}
