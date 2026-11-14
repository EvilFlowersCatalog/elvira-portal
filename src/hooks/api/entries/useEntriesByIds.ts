import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IEntry } from '../../../utils/interfaces/entry';
import useGetEntries from './useGetEntries';

/**
 * Ids per request. They are UUIDs in the query string (36 characters + a comma, ~37 once encoded), so 40 keep
 * the `id=` value near 1.5 kB and the whole URL well under the ~4 kB some proxies and gateways cut at; more ids
 * are split into several requests. An answer recommends a handful, so one request is the rule.
 */
const MAX_PER_REQUEST = 40;

const entriesByIdsKey = (ids: string[]) => ['entries-by-ids', ids] as const;

/**
 * Resolves publication ids to list records with one `GET /api/v1/entries?id=<csv>` instead of one detail call
 * per id (#14). The catalog returns them in its own order and drops the ones the caller may not see, so the
 * result is put back in the order of `ids`, without the missing ones.
 */
const useFetchEntriesByIds = () => {
  const getEntries = useGetEntries();

  return async (ids: string[]): Promise<IEntry[]> => {
    const unique = [...new Set(ids)];
    const batches: string[][] = [];
    for (let i = 0; i < unique.length; i += MAX_PER_REQUEST) batches.push(unique.slice(i, i + MAX_PER_REQUEST));
    const lists = await Promise.all(
      batches.map((batch) =>
        // Sorted by the default `-created_at`; the order of `ids` is restored below.
        getEntries({ page: 1, limit: batch.length, ids: batch.join(',') }),
      ),
    );
    const byId = new Map(lists.flatMap((list) => list.items).map((entry) => [entry.id, entry]));
    return unique.map((id) => byId.get(id)).filter((entry): entry is IEntry => !!entry);
  };
};

/** `ids` as entries, cached by React Query (the assistant's recommendation cards). */
const useEntriesByIds = (ids: string[]) => {
  const fetchEntriesByIds = useFetchEntriesByIds();
  return useQuery({
    queryKey: entriesByIdsKey(ids),
    queryFn: () => fetchEntriesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
  });
};

/** The same lookup outside a component's render, through the same cache (the viewer's suggestion cards). */
export const useEntriesByIdsFetcher = () => {
  const queryClient = useQueryClient();
  const fetchEntriesByIds = useFetchEntriesByIds();
  return (ids: string[]) =>
    ids.length
      ? queryClient.fetchQuery({
          queryKey: entriesByIdsKey(ids),
          queryFn: () => fetchEntriesByIds(ids),
          staleTime: 60 * 1000,
        })
      : Promise.resolve([] as IEntry[]);
};

export default useEntriesByIds;
