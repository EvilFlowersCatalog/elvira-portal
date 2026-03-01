import { IFeedQuery, IFeedsList } from '../../../utils/interfaces/feed';
import useAxios from '../useAxios';
import useAppContext from '../../contexts/useAppContext';

const useGetFeeds = () => {
  const axios = useAxios();
  const { selectedCatalogId } = useAppContext();

  const getFeeds = async ({
    page,
    limit,
    parentId,
    title,
    kind,
    orderBy,
    paginate,
  }: IFeedQuery): Promise<IFeedsList> => {
    // Set params
    const params = new URLSearchParams();
    if (selectedCatalogId) params.set('catalog_id', selectedCatalogId);

    if (orderBy) params.set('order_by', orderBy);
    else params.set('order_by', '-created_at');

    // Check if there is param, if yes set it
    if (paginate === false) params.set('paginate', 'false');
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    if (title) params.set('title', title);
    if (parentId) params.set('parent_id', parentId);
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
