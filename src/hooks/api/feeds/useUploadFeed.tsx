import { IFeedNew } from '../../../utils/interfaces/feed';
import useAxios from '../axios/useAxios';

const useUploadFeed = () => {
  const axios = useAxios();

  const uploadFeed = async (feed: IFeedNew) => {
    const UPLOAD_FEED_URL = '/api/v1/feeds';
    await axios.post(UPLOAD_FEED_URL, feed);
  };

  return uploadFeed;
};

export default useUploadFeed;
