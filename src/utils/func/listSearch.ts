const STORAGE_KEY = 'elvira-list-search';

// Dialog state, not list state: returning to a list must not reopen a dialog.
const DIALOG_PARAMS = [
  'entry-detail-id',
  'entry-catalog-id',
  'licensing-entry-id',
  'licensing-catalog-id',
  'assistant-entry-id',
  'dialog-priority',
];

const read = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const normalize = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** Record the query string a page is showing (called on every location change). */
export const rememberSearch = (pathname: string, search: string) => {
  const params = new URLSearchParams(search);
  DIALOG_PARAMS.forEach((p) => params.delete(p));
  const query = params.toString();

  const stored = read();
  const key = normalize(pathname);
  if (query) stored[key] = `?${query}`;
  else delete stored[key];
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable: back links simply fall back to the bare path.
  }
};

/**
 * `path` with the search, filters, sort and page it was last left with, for
 * in-app "back" navigation (back links, breadcrumbs, redirects after save/delete).
 * A path that already carries its own query is returned untouched.
 */
export const withRememberedSearch = (path: string) =>
  path.includes('?') ? path : path + (read()[normalize(path)] ?? '');
