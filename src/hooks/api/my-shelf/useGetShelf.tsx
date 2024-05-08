import { IEntryQuery } from '../../../utils/interfaces/entry';
import { IMyShelfList } from '../../../utils/interfaces/my-shelf';
import useAxios from '../axios/useAxios';

const useGetShelf = () => {
  const axios = useAxios();
  const getShelf = async ({
    page,
    limit,
    title,
    feedId,
    orderBy,
    publishedAtGte,
    publishedAtLte,
    query,
    authors,
  }: IEntryQuery): Promise<IMyShelfList> => {
    // Set params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);

    if (orderBy) params.set('order_by', orderBy);
    else params.set('order_by', '-created_at');

    // Check if there is param, if yes set it
    if (title) params.set('title', title);
    if (feedId) params.set('feed_id', feedId);
    if (publishedAtGte) params.set('published_at_gte', publishedAtGte);
    if (publishedAtLte) params.set('published_at_lte', publishedAtLte);
    if (authors) params.set('author', authors);
    if (query) params.set('query', query);

    // Get shelf by params
    const MY_SHELF_URL = '/api/v1/shelf-records';
    const { data: shelf } = await axios.get<IMyShelfList>(MY_SHELF_URL, {
      params,
    });

    // Return entries
    return shelf;
  };

  // Return function
  return getShelf;
};

export default useGetShelf;
