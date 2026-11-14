import { useQueryClient } from '@tanstack/react-query';
import { IFeedDetail } from '../../../utils/interfaces/feed';
import useAxios from '../useAxios';

/** Query key of one feed's detail, as `useCachedFeedDetail` caches it. */
export const feedDetailKey = (feedId: string) => ['feed-detail', feedId] as const;

/** How long a cached feed title is reused before it is fetched again. */
const TITLE_STALE_MS = 5 * 60 * 1000;

const useGetFeedDetail = () => {
  const axios = useAxios();

  const getFeedDetail = async (feed_id: string): Promise<IFeedDetail> => {
    const FEED_DETAIL_URL = `/api/v1/feeds/${feed_id}`;
    const { data: feedDetail } = await axios.get<{response: IFeedDetail}>(FEED_DETAIL_URL);

    return feedDetail.response;
  };

  return getFeedDetail;
};

/**
 * The same request through React Query: repeated resolutions of one feed (breadcrumbs on every
 * filter change, the Home row title) are cached and de-duplicated. Edits invalidate it (`useEditFeed`).
 * Admin screens that must see the latest state keep using `useGetFeedDetail`.
 */
export const useCachedFeedDetail = () => {
  const queryClient = useQueryClient();
  const getFeedDetail = useGetFeedDetail();

  return (feedId: string): Promise<IFeedDetail> =>
    queryClient.fetchQuery({
      queryKey: feedDetailKey(feedId),
      queryFn: () => getFeedDetail(feedId),
      staleTime: TITLE_STALE_MS,
    });
};

export default useGetFeedDetail;
