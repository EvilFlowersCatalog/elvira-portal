import { config } from '../config';

/**
 * The portal's addresses, built in one place (docs/semantic-urls.md). Call sites never concatenate paths.
 *
 * A link is an address, never a grant: nothing here carries a token, a signed URL or document content.
 * Whoever opens a link passes the same checks as a click (login, catalog permission, content policy, LCP).
 */

/** Tabs of a publication, the same in the dialog and on the page. */
export const ENTRY_TABS = ['contents', 'reviews', 'chapters', 'related', 'figures'] as const;
export type EntryTab = (typeof ENTRY_TABS)[number];
export const isEntryTab = (value: unknown): value is EntryTab =>
  typeof value === 'string' && (ENTRY_TABS as readonly string[]).includes(value);

/** Navigator sections of the reader worth a link (the Share / Info / Print cards are not). */
export const READER_PANELS = ['toc', 'pages', 'search', 'highlights'] as const;
export type ReaderPanel = (typeof READER_PANELS)[number];
export const isReaderPanel = (value: unknown): value is ReaderPanel =>
  typeof value === 'string' && (READER_PANELS as readonly string[]).includes(value);

/** A publication outside the portal's own catalog says which one; the portal's own needs no param. */
const catalogParam = (params: URLSearchParams, catalogId?: string | null) => {
  if (catalogId && catalogId !== config.ELVIRA_CATALOG_ID) params.set('catalog', catalogId);
};

const withQuery = (path: string, params: URLSearchParams) => {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const seg = encodeURIComponent;

export const ENTRY_ROUTE = '/entries/:entryId';
export const ENTRY_TAB_ROUTE = '/entries/:entryId/:tab';
export const READER_ROUTE = '/entries/:entryId/read';

/** `/entries/<id>[/<tab>]`: the publication page; the canonical link to a publication. */
export const entryPath = (entryId: string, options: { tab?: EntryTab | null; catalogId?: string | null } = {}) => {
  const params = new URLSearchParams();
  catalogParam(params, options.catalogId);
  return withQuery(`/entries/${seg(entryId)}${options.tab ? `/${options.tab}` : ''}`, params);
};

export interface ReaderLocation {
  /** Acquisition (file) id; omitted for the publication's readable PDF. */
  file?: string | null;
  /** Physical page, 1-based, in the reader's numbering. */
  page?: number | null;
  /** A printed page label (`iv`, `231`); wins over `page` when the PDF resolves it. */
  label?: string | null;
  /** Catalog locator key of a passage or figure (#171); re-resolved on every load. */
  loc?: string | null;
  /** Extraction paragraph / region ids, for links made before locators. */
  p?: string | null;
  r?: string | null;
  /** In-book search. */
  q?: string | null;
  panel?: ReaderPanel | null;
  catalogId?: string | null;
}

/** `/entries/<id>/read?…`: the reader at a place in the publication. */
export const readerPath = (entryId: string, at: ReaderLocation = {}) => {
  const params = new URLSearchParams();
  if (at.file) params.set('file', at.file);
  if (at.page && at.page > 0) params.set('page', String(Math.floor(at.page)));
  if (at.label) params.set('label', at.label);
  if (at.loc) params.set('loc', at.loc);
  if (at.p) params.set('p', at.p);
  if (at.r) params.set('r', at.r);
  if (at.q) params.set('q', at.q);
  if (at.panel) params.set('panel', at.panel);
  catalogParam(params, at.catalogId);
  return withQuery(`/entries/${seg(entryId)}/read`, params);
};

/** The publication a path is about, and how it is open there (assistant context, chrome decisions). */
export const matchEntryPath = (pathname: string): { entryId: string; view: 'page' | 'reader' } | null => {
  const match = /^\/entries\/([^/]+)(?:\/([^/]+))?\/?$/.exec(pathname);
  if (!match) return null;
  return { entryId: decodeURIComponent(match[1]), view: match[2] === 'read' ? 'reader' : 'page' };
};

/** The reader is full-screen: no navigation, no assistant launcher around it. */
export const isReaderPath = (pathname: string) => matchEntryPath(pathname)?.view === 'reader';

/** `/cite/<entry>/<key>`: the durable passage link the catalog hands to agents (#46). */
export const citePath = (entryId: string, key: string) => `/cite/${seg(entryId)}/${seg(key)}`;

/**
 * A `next` / return-to value as a same-origin path, or `/`. Accepts only paths starting with a single
 * `/` and no scheme, so a crafted link cannot send a reader off-site after login (open redirect).
 */
export const safeNext = (raw: string | null | undefined, fallback = '/'): string => {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  try {
    const url = new URL(raw, 'http://portal.invalid');
    if (url.origin !== 'http://portal.invalid') return fallback;
    if (url.pathname === '/login') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};

/** `/login[?next=…]`: login returns to `next`. */
export const loginPath = (next?: string | null) => {
  const target = safeNext(next, '');
  return target && target !== '/' ? `/login?${new URLSearchParams({ next: target })}` : '/login';
};

/** An absolute URL for a path, for Copy link and the Web Share API. */
export const absoluteUrl = (path: string) => new URL(path, window.location.origin).toString();
