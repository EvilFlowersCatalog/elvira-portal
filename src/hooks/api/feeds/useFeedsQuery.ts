import { useQuery } from '@tanstack/react-query';
import { IFeedQuery } from '../../../utils/interfaces/feed';
import useGetFeeds from './useGetFeeds';
import useAppContext from '../../contexts/useAppContext';

/**
 * React Query wrapper around the feeds (collections) endpoint. Reuses
 * `useGetFeeds` for param building and adds caching, de-duplication, retries and
 * `isLoading`/`isError` state. Pass `enabled: false` to defer the fetch.
 */
const useFeedsQuery = (
  query: Partial<IFeedQuery> = {},
  options?: { enabled?: boolean }
) => {
  const getFeeds = useGetFeeds();
  const { selectedCatalogId } = useAppContext();

  return useQuery({
    queryKey: ['feeds', selectedCatalogId, query],
    queryFn: () => getFeeds(query as IFeedQuery),
    enabled: options?.enabled ?? true,
  });
};

export default useFeedsQuery;
