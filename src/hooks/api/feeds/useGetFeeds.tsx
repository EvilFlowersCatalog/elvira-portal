import { IFeedQuery, IFeedsList } from '../../../utils/interfaces/feed';
import useAxios from '../axios/useAxios';

const useGetFeeds = () => {
  const axios = useAxios();

  const getFeeds = async ({
    page,
    limit,
    parentId,
    title,
    kind,
    orderBy,
  }: IFeedQuery): Promise<IFeedsList> => {
    // Set params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);

    // Check if there is param, if yes set it
    if (title) params.set('title', title);
    if (parentId) params.set('parent_id', parentId);
    if (orderBy) params.set('order_by', orderBy);
    if (kind) params.set('kind', kind);

    // Get feeds by params
    const GET_ENTRIES_URL = '/api/v1/feeds';
    const { data: feeds } = await axios.get<IFeedsList>(GET_ENTRIES_URL, {
      params,
    });

    // Return feeds
    return feeds;
  };

  // Return function
  return getFeeds;
};

export default useGetFeeds;
