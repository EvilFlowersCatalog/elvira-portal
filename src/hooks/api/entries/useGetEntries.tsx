import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useAxios from '../axios/useAxios';

const useGetEntries = () => {
  const axios = useAxios();

  const getEntries = async ({
    page,
    limit,
    title,
    feedId,
    orderBy,
    publishedAtGte,
    publishedAtLte,
    authors,
  }: IEntryQuery): Promise<IEntriesList> => {
    // Set params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);

    // Check if there is param, if yes set it
    if (title) params.set('title', title);
    if (feedId) params.set('feed_id', feedId);
    if (orderBy) params.set('order_by', orderBy);
    if (publishedAtGte) params.set('published_at_gte', publishedAtGte);
    if (publishedAtLte) params.set('published_at_lte', publishedAtLte);
    if (authors) params.set('author', authors);

    // Get entries by params
    const GET_ENTRIES_URL = '/api/v1/entries';
    const { data: entries } = await axios.get<IEntriesList>(GET_ENTRIES_URL, {
      params,
    });

    // Return entries
    return entries;
  };

  // Return function
  return getEntries;
};

export default useGetEntries;
