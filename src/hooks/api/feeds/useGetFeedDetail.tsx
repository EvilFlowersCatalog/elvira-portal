import { IFeedDetail } from '../../../utils/interfaces/feed';
import useAxios from '../useAxios';

const useGetFeedDetail = () => {
  const axios = useAxios();

  const getFeedDetail = async (feed_id: string): Promise<IFeedDetail> => {
    const FEED_DETAIL_URL = `/api/v1/feeds/${feed_id}`;
    const { data: feedDetail } = await axios.get(FEED_DETAIL_URL);

    return feedDetail;
  };

  return getFeedDetail;
};

export default useGetFeedDetail;
