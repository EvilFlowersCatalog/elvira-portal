import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';
import { buildEntryFilterParams } from './entryFilters';

const useGetEntries = () => {
  const axios = useAxios();

  const getEntries = async (
    { page, limit, orderBy, include, ...filters }: IEntryQuery,
    signal?: AbortSignal
  ): Promise<IEntriesList> => {
    // Set params
    const params = buildEntryFilterParams(filters);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    // A search without an explicit sort is ranked by relevance, which the catalog
    // does only when `order_by` is absent. Browsing defaults to newest first.
    if (orderBy) params.set('order_by', orderBy);
    else if (!filters.query) params.set('order_by', '-created_at');
    if (include) params.set('include', include);

    // Get entries by params
    const GET_ENTRIES_URL = '/api/v1/entries';
    const { data: entries } = await axios.get<IEntriesList>(GET_ENTRIES_URL, {
      params,
      signal,
    });

    // Return entries
    return entries;
  };

  // Return function
  return getEntries;
};

export default useGetEntries;
