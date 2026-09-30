import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEntryQuery } from '../../../utils/interfaces/entry';
import { AvailabilityState } from '../../../components/items/entry/details/AvailabilityBadge';
import { readCategoryIds, readFeedIds } from '../../../utils/func/filterParams';

export type EntryFilters = Omit<IEntryQuery, 'page' | 'limit'>;

// Sidebar availability -> backend `lcp_state` values. The backend OR-s the values,
// and the mapping mirrors the badge logic in EntryItem.
const AVAILABILITY_TO_LCP_STATE: Record<AvailabilityState, string[]> = {
  available: ['available_now'],
  unavailable: ['fully_borrowed', 'available_in_days'],
  borrowed: ['active_loan_for_user'],
  reserved: ['reserved'],
};

export const availabilityToLcpState = (availability: string): string =>
  availability
    .split(',')
    .flatMap((value) => AVAILABILITY_TO_LCP_STATE[value as AvailabilityState] ?? [])
    .join(',');

/**
 * Filter params shared by the entries list and the facets endpoint (no paging or
 * ordering). Values inside one param are OR-ed by the backend (`IN (...)`), separate
 * params are AND-ed: (feed OR feed) AND (category OR category) AND language AND year.
 */
export const buildEntryFilterParams = (query: EntryFilters): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);

  if (query.title) params.set('title', query.title);
  if (query.publishedAtGte) params.set('published_at__gte', query.publishedAtGte);
  if (query.publishedAtLte) params.set('published_at__lte', query.publishedAtLte);
  if (query.authors) params.set('author', query.authors);
  if (query.query) params.set('query', query.query);
  if (query.languageCode) params.set('language_code', query.languageCode);
  if (query.lcpState) params.set('lcp_state', query.lcpState);
  if (query.ids) params.set('id', query.ids);

  // Merge the single-select (`feedId`/`categoryId`) and multi-select
  // (`feeds`/`categories`) values into one CSV — the backend expands it to IN (...).
  const feedIds = [query.feedId, query.feeds].filter(Boolean).join(',');
  if (feedIds) params.set('feed_id', feedIds);

  const categoryIds = [query.categoryId, query.categories].filter(Boolean).join(',');
  if (categoryIds) params.set('category_id', categoryIds);

  return params;
};

/**
 * The entry filters currently in the URL. Only params that affect the result set
 * are read, so opening a book (which adds entry-detail-id) doesn't change the
 * query key and reset the list or scroll position.
 */
export const useEntryFilters = (): EntryFilters => {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const feedIds = readFeedIds(searchParams);
    return {
      title: searchParams.get('title') ?? '',
      // An explicit collection filter wins over the /feeds drill-down step.
      feedId: feedIds.length > 0 ? '' : searchParams.get('feed-id-step') ?? '',
      authors: searchParams.get('author') ?? '',
      publishedAtGte: searchParams.get('publishedAtGte') ?? '',
      publishedAtLte: searchParams.get('publishedAtLte') ?? '',
      orderBy: searchParams.get('order-by') ?? '',
      query: searchParams.get('query') ?? '',
      languageCode: searchParams.get('languageCode') ?? '',
      categories: readCategoryIds(searchParams).join(','),
      feeds: feedIds.join(','),
      lcpState: availabilityToLcpState(searchParams.get('availability') ?? ''),
    };
  }, [searchParams]);
};
