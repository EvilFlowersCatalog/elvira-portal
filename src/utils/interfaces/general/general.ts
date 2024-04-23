export enum NAVIGATION_PATHS {
  login = '/login',
  notFound = '/404',
  home = '/',
  library = '/library',
  myShelf = '/my-shelf',
  loansHistory = '/loans-history',
  feeds = '/feeds',
  advancedSearch = '/advanced-search',
  about = '/about',
  viewer = '/viewer/',
  adminHome = '/admin/home',
  adminEntries = '/admin/entries',
  adminAddEntries = '/admin/entries/add',
  adminEditEntries = '/admin/entries/edit/',
  adminFeeds = '/admin/feeds',
}

export enum THEME_TYPE {
  dark = 'dark',
  light = 'light',
}

export enum LANG_TYPE {
  sk = 'sk',
  en = 'en',
}

export enum IDENTIFIERS_TYPE {
  doi = 'doi',
  isbn = 'isbn',
}

export enum DATA_TYPE {
  entries,
  feeds,
  myShelf,
}

export interface IMetadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

export interface IZotero {
  title: string;
  year?: string;
  journalTitle?: string;
  firstPage?: number;
  lastPage?: number;
  publisher?: string;
  doi?: string;
  isbn?: string;
  abstract?: string;
  authors: string;
  pdfUrl: string;
}
