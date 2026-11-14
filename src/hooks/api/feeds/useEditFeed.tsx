import { useQueryClient } from '@tanstack/react-query';
import { IFeedNew } from '../../../utils/interfaces/feed';
import useAxios from '../useAxios';
import { feedDetailKey } from './useGetFeedDetail';

const useEditFeed = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  const editFeed = async (feed_id: string, feed: IFeedNew) => {
    const EDIT_FEED_URL = `/api/v1/feeds/${feed_id}`;
    await axios.put(EDIT_FEED_URL, feed);
    // A renamed feed must not keep its old title in the breadcrumb.
    queryClient.invalidateQueries({ queryKey: feedDetailKey(feed_id) });
  };

  return editFeed;
};

export default useEditFeed;
