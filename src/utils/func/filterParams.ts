/**
 * Category and collection filters live in the URL as multi-select
 * `categories=a,b` / `feeds=a,b` (the backend OR-s the ids within one filter and
 * AND-s the filters). The legacy single-value `category-id` / `feed-id` names are
 * still read, so old links and bookmarks keep filtering, and cleared on write.
 *
 * `AdvancedSearch` rewrites the whole filter set on every pass, so every read and
 * write goes through here to keep call sites agreeing on the names.
 */

type ParamPair = { multi: string; single: string };

const CATEGORY: ParamPair = { multi: 'categories', single: 'category-id' };
const FEED: ParamPair = { multi: 'feeds', single: 'feed-id' };

/** The param name that is read and written. */
const activeName = (pair: ParamPair) => pair.multi;

/** The legacy single-value name, cleared on write so only one is ever live. */
const staleName = (pair: ParamPair) => pair.single;

/**
 * Reads both conventions and merges them, so a link saved under the other one
 * (an old bookmark, a build with the flag flipped) still filters instead of
 * being dropped. The next write canonicalises it to the active name.
 */
const readIds = (params: URLSearchParams, pair: ParamPair): string[] => {
  const raw = [params.get(activeName(pair)), params.get(staleName(pair))]
    .filter(Boolean)
    .join(',');
  return Array.from(new Set(raw.split(',').filter(Boolean)));
};

const writeIds = (params: URLSearchParams, pair: ParamPair, ids: string[]): void => {
  const kept = Array.from(new Set(ids.filter(Boolean)));

  if (kept.length > 0) params.set(activeName(pair), kept.join(','));
  else params.delete(activeName(pair));

  params.delete(staleName(pair));
};

/** Adds one id to the filter (OR-ed with the ids already selected). */
const addId = (params: URLSearchParams, pair: ParamPair, id: string): void =>
  writeIds(params, pair, [...readIds(params, pair), id]);

export const readCategoryIds = (params: URLSearchParams) => readIds(params, CATEGORY);
export const readFeedIds = (params: URLSearchParams) => readIds(params, FEED);

export const setCategoryIds = (params: URLSearchParams, ids: string[]) => writeIds(params, CATEGORY, ids);
export const setFeedIds = (params: URLSearchParams, ids: string[]) => writeIds(params, FEED, ids);

export const addCategoryId = (params: URLSearchParams, id: string) => addId(params, CATEGORY, id);
export const addFeedId = (params: URLSearchParams, id: string) => addId(params, FEED, id);
