/**
 * Category and collection filters live in the URL under two conventions: the
 * multi-select `categories=a,b` / `feeds=a,b` used when experimental features
 * are on, and the single-value `category-id` / `feed-id` the stable build uses.
 *
 * `AdvancedSearch` rewrites the whole filter set on every pass and deletes the
 * convention it isn't reading, so a writer that picks the other name has its
 * filter wiped a moment after setting it. Every read and write goes through
 * here so no call site has to know which name is current.
 */

type ParamPair = { multi: string; single: string };

const CATEGORY: ParamPair = { multi: 'categories', single: 'category-id' };
const FEED: ParamPair = { multi: 'feeds', single: 'feed-id' };

const isExperimental = () => import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';

/** The param name this build reads and writes. */
const activeName = (pair: ParamPair) => (isExperimental() ? pair.multi : pair.single);

/** The other convention's name, cleared on write so only one is ever live. */
const staleName = (pair: ParamPair) => (isExperimental() ? pair.single : pair.multi);

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
  const unique = Array.from(new Set(ids.filter(Boolean)));
  // The stable build has a single slot per filter, so extra ids are dropped
  // rather than written under a name nothing reads back.
  const kept = isExperimental() ? unique : unique.slice(0, 1);

  if (kept.length > 0) params.set(activeName(pair), kept.join(','));
  else params.delete(activeName(pair));

  params.delete(staleName(pair));
};

/** Adds one id to the filter — appends where the build supports several, replaces where it doesn't. */
const addId = (params: URLSearchParams, pair: ParamPair, id: string): void =>
  writeIds(params, pair, isExperimental() ? [...readIds(params, pair), id] : [id]);

export const readCategoryIds = (params: URLSearchParams) => readIds(params, CATEGORY);
export const readFeedIds = (params: URLSearchParams) => readIds(params, FEED);

export const setCategoryIds = (params: URLSearchParams, ids: string[]) => writeIds(params, CATEGORY, ids);
export const setFeedIds = (params: URLSearchParams, ids: string[]) => writeIds(params, FEED, ids);

export const addCategoryId = (params: URLSearchParams, id: string) => addId(params, CATEGORY, id);
export const addFeedId = (params: URLSearchParams, id: string) => addId(params, FEED, id);
