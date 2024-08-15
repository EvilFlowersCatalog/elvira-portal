import useAxios from '../useAxios';

const useDeleteFeed = () => {
  const axios = useAxios();

  const deleteFeed = async (feed_id: string) => {
    const DELETE_FEED_URL = `/api/v1/feeds/${feed_id}`;
    await axios.delete(DELETE_FEED_URL);
  };

  return deleteFeed;
};

export default useDeleteFeed;
