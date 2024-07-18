import { ReactNode, MouseEvent, RefObject } from 'react';
import { IAuth, IAuthCredentials, IUpdatedAuth } from './auth';
import {
  DATA_TYPE,
  LANG_TYPE,
  LAYOUT_TYPE,
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
  login: (loginForm: IAuthCredentials) => Promise<void>;
  logout: () => void;
}

export interface IAppContext {
  theme: THEME_TYPE;
  updateTheme: (theme: THEME_TYPE) => void;
  lang: LANG_TYPE;
  updateLang: (lang: LANG_TYPE) => void;
  layout: LAYOUT_TYPE;
  updateLayout: (layout: LAYOUT_TYPE) => void;
  clearFilters: () => void;
  specialNavigation: (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => void;
  isSmallDevice: boolean;
  showNavbar: boolean;
  setShowNavbar: (showNavbar: boolean) => void;
  showSearchBar: boolean;
  setShowSearchBar: (showSearchBar: boolean) => void;
  isParamsEmpty: () => boolean;
  searchParamsEqual: (
    prevSearchParams: URLSearchParams | null,
    currentSearchParams: URLSearchParams
  ) => boolean;
  handleScroll: (
    scrollRef: RefObject<HTMLDivElement>,
    page: number,
    setPage: (page: number) => void,
    maxPage: number,
    loadingNext: boolean,
    setLoadingNext: (loadingNext: boolean) => void,
    showScrollUp: boolean,
    setShowScrollUp: (showScrollUp: boolean) => void
  ) => void;
  STUColor: string;
  logoDark: string;
  logoLight: string;
  titleLogoDark: string;
  titleLogoLight: string;
  stuLogoDark: string;
  stuLogoLight: string;
  editingEntryTitle: string;
  setEditingEntryTitle: (editingEntryTitle: string) => void;
}
