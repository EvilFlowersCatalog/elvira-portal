import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';
import { buildEntryFilterParams } from './entryFilters';

const useGetEntries = () => {
  const axios = useAxios();

  const getEntries = async ({ page, limit, orderBy, ...filters }: IEntryQuery): Promise<IEntriesList> => {
    // Set params
    const params = buildEntryFilterParams(filters);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('order_by', orderBy || '-created_at');

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
