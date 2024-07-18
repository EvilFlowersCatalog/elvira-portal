export enum NAVIGATION_PATHS {
  login = '/login',
  notFound = '/404',
  home = '/',
  library = '/library',
  shelf = '/shelf',
  loans = '/loans',
  feeds = '/feeds',
  about = '/about',
  viewer = '/viewer/',
  adminHome = '/administration',
  adminEntries = '/administration/entries',
  adminAddEntries = '/administration/entries/add',
  adminEditEntries = '/administration/entries/edit/',
  adminFeeds = '/administration/feeds',
  adminCategories = '/administration/categories',
}

export enum THEME_TYPE {
  dark = 'dark',
  light = 'light',
}

export enum LANG_TYPE {
  sk = 'sk',
  en = 'en',
}

export enum LAYOUT_TYPE {
  list = 'list',
  box = 'box',
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

export interface IModalParams {
  close: (open: boolean) => void;
  yes: () => void;
}
