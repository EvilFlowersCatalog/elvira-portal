/**
 * Every query parameter the portal's own pages use, with what it does (docs/semantic-urls.md §6).
 *
 * - `filter`: narrows a list; part of its query key, shown as a chip.
 * - `view`: how a list is shown (sort, results tab, drill-down step); part of the query key, no chip.
 * - `dialog`: an overlay over the page (detail, borrow, assistant); never part of a query key and never
 *   remembered as a list's state (listSearch), so returning to a list doesn't reopen a dialog.
 *
 * Names are kept as they are: they are a contract with the assistant (`portal_context`, `navigate` frames)
 * and with links already in e-mails and chats. Old spellings are read through `aliases` where they exist.
 */
export type ParamKind = 'filter' | 'view' | 'dialog';

interface ParamSpec {
  kind: ParamKind;
  /** Worth the assistant's attention (`portal_context.path`). */
  context?: boolean;
}

export const PARAMS = {
  // Lists: search and filters.
  query: { kind: 'filter', context: true },
  q: { kind: 'filter', context: true },
  title: { kind: 'filter' },
  author: { kind: 'filter' },
  'author-id': { kind: 'view' },
  categories: { kind: 'filter' },
  'category-id': { kind: 'filter', context: true },
  feeds: { kind: 'filter' },
  'feed-id': { kind: 'filter', context: true },
  publishedAtGte: { kind: 'filter' },
  publishedAtLte: { kind: 'filter' },
  languageCode: { kind: 'filter' },
  availability: { kind: 'filter' },
  'rating-min': { kind: 'filter' },
  state: { kind: 'filter', context: true },
  status: { kind: 'filter' },
  // Lists: presentation.
  'order-by': { kind: 'view' },
  order_by: { kind: 'view' },
  page: { kind: 'view' },
  limit: { kind: 'view' },
  results: { kind: 'view' },
  tab: { kind: 'view', context: true },
  'feed-id-step': { kind: 'view' },
  'parent-id': { kind: 'view' },
  'search-all': { kind: 'view' },
  from: { kind: 'view' },
  // Overlays.
  'entry-detail-id': { kind: 'dialog', context: true },
  'entry-catalog-id': { kind: 'dialog' },
  'entry-tab': { kind: 'dialog', context: true },
  'licensing-entry-id': { kind: 'dialog' },
  'licensing-catalog-id': { kind: 'dialog' },
  'assistant-entry-id': { kind: 'dialog' },
  'dialog-priority': { kind: 'dialog' },
} satisfies Record<string, ParamSpec>;

export type ParamName = keyof typeof PARAMS;

const spec = (name: string): ParamSpec | undefined => (PARAMS as Record<string, ParamSpec>)[name];

export const paramKind = (name: string): ParamKind | undefined => spec(name)?.kind;

/** Dialog params, which open something over the page rather than change it. */
export const isDialogParam = (name: string) => paramKind(name) === 'dialog';

/** A list's own state: everything except dialogs (unknown params count, so nothing is dropped silently). */
export const withoutDialogParams = (search: URLSearchParams | string): URLSearchParams => {
  const params = new URLSearchParams(search);
  [...params.keys()].filter(isDialogParam).forEach((key) => params.delete(key));
  return params;
};

/** True when the URL narrows the list (a search or a filter), dialogs and presentation aside. */
export const hasListFilters = (search: URLSearchParams) =>
  [...search.keys()].some((key) => {
    const kind = paramKind(key);
    return kind === undefined || kind === 'filter';
  });

/** The params the assistant is told about, values capped. */
export const contextParams = (search: URLSearchParams, maxLength = 120): URLSearchParams => {
  const kept = new URLSearchParams();
  search.forEach((value, key) => {
    if (spec(key)?.context && value) kept.set(key, value.slice(0, maxLength));
  });
  return kept;
};
