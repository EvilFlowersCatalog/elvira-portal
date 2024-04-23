import { ReactNode, MouseEvent } from 'react';
import { IAuth, IUpdatedAuth } from './auth';
import {
  DATA_TYPE,
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from './general/general';
import { IEntry } from './entry';
import { IFeed } from './feed';
import { IMyShelf } from './my-shelf';

export interface IContextProviderParams {
  children: ReactNode;
}

export interface IDataProviderParams {
  type: DATA_TYPE;
  children: ReactNode;
}

export interface IAuthContext {
  auth: IAuth | null;
  updateAuth: (auth: IUpdatedAuth) => void;
  login: (auth: IAuth) => void;
  logout: () => void;
}

export interface IAppContext {
  theme: THEME_TYPE;
  updateTheme: (theme: THEME_TYPE) => void;
  lang: LANG_TYPE;
  updateLang: (lang: LANG_TYPE) => void;
  showLoader: boolean;
  setShowLoader: (showLoader: boolean) => void;
  isSearchNeeded: () => boolean;
  specialNavigation: (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => void;
  STUColor: string;
}

export interface IDataPageContext {
  data: IEntry[] | IFeed[] | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  refreshPage: boolean;
  setRefreshPage: (refreshPage: boolean) => void;
}
