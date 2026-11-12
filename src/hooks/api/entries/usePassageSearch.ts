import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IEntry } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';
import useGetEntries from './useGetEntries';
import { buildEntryFilterParams, EntryFilters } from './entryFilters';

/** One paragraph of a publication that matched the query (catalog #113). */
export interface IPassage {
  paragraph_id: string;
  /** PDF page, 1-based, as the viewer numbers an open-access entry. */
  page: number;
  section: string | null;
  score: number;
  matched: string[];
  /** Null for Readium LCP and IP-blocked entries. */
  text: string | null;
  truncated: boolean;
  /** HTML-escaped, `<mark>` is the only markup. Null where `text` is null. */
  snippet: string | null;
}

export interface IPassageHit {
  entry_id: string;
  catalog_id: string | null;
  score: number;
  passages: IPassage[];
  /** Resolved with `GET /api/v1/entries?id=...`; missing when the entry could not be loaded. */
  entry?: IEntry;
}

export interface IPassageSearch {
  query: string;
  degraded: boolean;
  indexed: number;
  searchable: number;
  items: IPassageHit[];
}

/**
 * Search inside books: `GET /api/v1/entries/passages`, grouped per publication,
 * then the publications resolved for their titles and covers in one request.
 * `filters` narrow the publications searched, as on `/api/v1/entries`.
 */
const usePassageSearch = (
  query: string,
  options?: { enabled?: boolean; limit?: number; perEntry?: number; filters?: EntryFilters }
) => {
  const axios = useAxios();
  const getEntries = useGetEntries();
  const limit = options?.limit ?? 6;
  const perEntry = options?.perEntry ?? 3;
  const filters = options?.filters;

  return useQuery({
    queryKey: ['entry-passages', query, limit, perEntry, filters ?? null],
    queryFn: async ({ signal }): Promise<IPassageSearch> => {
      const params = buildEntryFilterParams({ ...(filters ?? {}), query });
      params.set('limit', limit.toString());
      params.set('per_entry', perEntry.toString());
      const { data } = await axios.get<{ response: IPassageSearch }>('/api/v1/entries/passages', { params, signal });
      const result = data.response;
      if (result.items.length === 0) return result;

      const ids = result.items.map((hit) => hit.entry_id);
      try {
        const { items } = await getEntries({ page: 1, limit: ids.length, ids: ids.join(',') }, signal);
        const byId = new Map(items.map((entry) => [entry.id, entry]));
        return { ...result, items: result.items.map((hit) => ({ ...hit, entry: byId.get(hit.entry_id) })) };
      } catch {
        return result;
      }
    },
    enabled: (options?.enabled ?? true) && query.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};

export default usePassageSearch;
