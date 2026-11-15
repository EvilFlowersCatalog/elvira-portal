import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useGetEntries from './useGetEntries';

/**
 * React Query wrapper around the entries endpoint. Reuses `useGetEntries` for the
 * param building (single source of truth) and adds caching, de-duplication,
 * retries and `isLoading`/`isError` state. Pass `enabled: false` to defer the
 * fetch (e.g. until a search term is long enough).
 *
 * For infinite-scroll browsing use a `useInfiniteQuery`; this is for the fixed
 * page-based / one-shot reads (suggestions, autofills, admin tables, Home rows).
 */
const useEntriesQuery = (
  query: Partial<IEntryQuery>,
  options?: {
    enabled?: boolean;
    /** Poll (ms) while the last result says so, e.g. while a row's job is still running. */
    refetchInterval?: (data: IEntriesList | undefined) => number | false;
  }
) => {
  const getEntries = useGetEntries();

  return useQuery({
    queryKey: ['entries', query],
    queryFn: () =>
      getEntries({ page: 1, limit: 30, ...query } as IEntryQuery),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ? (query) => options.refetchInterval!(query.state.data) : undefined,
    // Keep the previous result on screen while a new query loads (e.g. as the
    // user types in the search suggestions) so the UI never flashes to a
    // loading/empty state — it just updates in place. `isFetching` /
    // `isPlaceholderData` expose the background activity for a subtle indicator.
    placeholderData: keepPreviousData,
  });
};

export default useEntriesQuery;
