import { IFeedNew } from '../../../utils/interfaces/feed';
import useAxios from '../useAxios';

const useUploadFeed = () => {
  const axios = useAxios();

  const uploadFeed = async (feed: IFeedNew) => {
    const UPLOAD_FEED_URL = '/api/v1/feeds';
    const { data } = await axios.post<{ response?: { id?: string }; id?: string } | undefined>(UPLOAD_FEED_URL, feed);
    return data;
  };

  return uploadFeed;
};

export default useUploadFeed;
