import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';
import useAppContext from '../../contexts/useAppContext';

const useGetEntries = () => {
  const axios = useAxios();
  const { selectedCatalogId } = useAppContext();

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
    languageCode,
    categories,
    feeds,
  }: IEntryQuery): Promise<IEntriesList> => {
    // Set params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (selectedCatalogId) params.set('catalog_id', selectedCatalogId);

    if (orderBy) params.set('order_by', orderBy);
    else params.set('order_by', '-created_at');

    // Check if there is param, if yes set it
    if (title) params.set('title', title);
    if (publishedAtGte) params.set('published_at__gte', publishedAtGte);
    if (publishedAtLte) params.set('published_at__lte', publishedAtLte);
    if (authors) params.set('author', authors);
    if (query) params.set('query', query);
    if (languageCode) params.set('language_code', languageCode);

    // Multi-select feeds/categories: the backend `feed_id` and `category_id`
    // filters accept a comma-separated UUID list (IN (...)), so merge the
    // single-select (`feedId`/`categoryId`) and multi-select (`feeds`/`categories`)
    // values into one CSV instead of dropping the multi-select ones.
    const feedIds = [feedId, feeds].filter(Boolean).join(',');
    if (feedIds) params.set('feed_id', feedIds);

    const categoryIds = [categoryId, categories].filter(Boolean).join(',');
    if (categoryIds) params.set('category_id', categoryIds);

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
