import { IFeedNew } from '../../../utils/interfaces/feed';
import useAxios from '../axios/useAxios';

const useEditFeed = () => {
  const axios = useAxios();

  const editFeed = async (feed_id: string, feed: IFeedNew) => {
    const EDIT_FEED_URL = `/api/v1/feeds/${feed_id}`;
    await axios.put(EDIT_FEED_URL, feed);
  };

  return editFeed;
};

export default useEditFeed;
