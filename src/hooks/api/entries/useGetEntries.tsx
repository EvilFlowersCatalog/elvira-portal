import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

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
    categoryId,
    query,
    languageId
  }: IEntryQuery): Promise<IEntriesList> => {
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
    if (publishedAtGte) params.set('published_at__gte', publishedAtGte);
    if (publishedAtLte) params.set('published_at__lte', publishedAtLte);
    if (authors) params.set('author', authors);
    if (categoryId) params.set('category_id', categoryId);
    if (query) params.set('query', query);
    if (languageId) params.set('language_id', languageId);

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
