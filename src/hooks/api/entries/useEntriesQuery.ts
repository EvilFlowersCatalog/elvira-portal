import { useQuery } from '@tanstack/react-query';
import { IEntryQuery } from '../../../utils/interfaces/entry';
import useGetEntries from './useGetEntries';
import useAppContext from '../../contexts/useAppContext';

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
  options?: { enabled?: boolean }
) => {
  const getEntries = useGetEntries();
  const { selectedCatalogId } = useAppContext();

  return useQuery({
    queryKey: ['entries', selectedCatalogId, query],
    queryFn: () =>
      getEntries({ page: 1, limit: 30, ...query } as IEntryQuery),
    enabled: options?.enabled ?? true,
  });
};

export default useEntriesQuery;
