import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAxios from '../useAxios';
import useGetEntries from '../entries/useGetEntries';
import { IEntry, IEntryQuery } from '../../../utils/interfaces/entry';
import { IEntryEncryption } from '../../../utils/interfaces/encryption';

/** Bulk actions over a whole filter stop at this many publications (one request each). */
export const BULK_CAP = 500;
const COLLECT_PAGE = 100;

/**
 * Imperative (not id-bound) calls behind the bulk actions of the "Background jobs" page. They do
 * not invalidate anything themselves — a bulk run refreshes the caches once, when it ends, so the
 * table does not reshuffle under the run.
 */
export default function useJobsApi() {
  const axios = useAxios();
  const client = useQueryClient();
  const getEntries = useGetEntries();

  return useMemo(
    () => ({
      /** The LCP job of one publication, sharing the row's cache (a fresh read, at most 3 s old). */
      encryption: (entryId: string) =>
        client.fetchQuery({
          queryKey: ['entry-encryption', entryId],
          staleTime: 3000,
          queryFn: async ({ signal }) =>
            (await axios.get<{ response: IEntryEncryption }>(`/readium/v1/entries/${entryId}/encryption`, { signal })).data
              .response,
        }),

      /** `POST /readium/v1/entries/{id}/encryption` without `force`: start a missing job or replace a failed one. */
      startEncryption: (entryId: string, signal: AbortSignal) =>
        axios.post(`/readium/v1/entries/${entryId}/encryption`, {}, { signal }),

      /** `POST …/encryption` with `force`: delete the job and its package, encrypt under a new content id. */
      recreateEncryption: (entryId: string, signal: AbortSignal) =>
        axios.post(`/readium/v1/entries/${entryId}/encryption`, { force: true }, { signal }),

      /** `POST /api/v1/entries/{id}/extraction`; `force` re-processes a finished run. */
      queueExtraction: (entryId: string, force: boolean, signal: AbortSignal) =>
        axios.post(`/api/v1/entries/${entryId}/extraction`, force ? { force: true } : {}, { signal }),

      /**
       * Every publication matching `query`, up to `BULK_CAP`, gathered before anything is changed —
       * paging through a status filter while the statuses move would skip rows. Ordered by creation
       * time (immutable) so the pages are stable.
       */
      collectEntries: async (query: Partial<IEntryQuery>, signal: AbortSignal): Promise<{ items: IEntry[]; total: number }> => {
        const items: IEntry[] = [];
        let page = 1;
        let total = 0;
        for (;;) {
          const res = await getEntries({ ...query, page, limit: COLLECT_PAGE, orderBy: 'created_at' } as IEntryQuery, signal);
          total = res.metadata.total;
          items.push(...res.items);
          if (items.length >= BULK_CAP || page >= res.metadata.pages || res.items.length === 0) break;
          page += 1;
        }
        return { items: items.slice(0, BULK_CAP), total };
      },

      /** Refresh what a bulk run changed. */
      invalidate: () => {
        client.invalidateQueries({ queryKey: ['entries'] });
        client.invalidateQueries({ queryKey: ['entry-encryption'] });
        client.invalidateQueries({ queryKey: ['entry-extraction'] });
        client.invalidateQueries({ queryKey: ['admin-statistics'] });
      },
    }),
    [axios, client, getEntries]
  );
}
