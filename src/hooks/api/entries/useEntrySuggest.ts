import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IEntrySuggestions } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

/**
 * Type-ahead in one request: entries, authors, categories and collections that
 * match `query` (the last word as a prefix). A newer keystroke aborts the stale
 * request through React Query's `signal`; the previous suggestions stay on screen
 * while the next ones load.
 */
const useEntrySuggest = (query: string, options?: { enabled?: boolean; limit?: number }) => {
  const axios = useAxios();
  const limit = options?.limit ?? 6;

  return useQuery({
    queryKey: ['entry-suggest', query, limit],
    queryFn: async ({ signal }) => {
      const { data } = await axios.get<{ response: IEntrySuggestions }>('/api/v1/entries/suggest', {
        params: { query, limit, catalog_id: import.meta.env.ELVIRA_CATALOG_ID },
        signal,
      });
      return data.response;
    },
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
};

export default useEntrySuggest;
