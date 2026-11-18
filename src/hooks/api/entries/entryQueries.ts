import { queryOptions } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { queryClient } from '@/lib/reactQuery';
import { baseAxios } from '../useAxios';
import { preloadEntryDialog } from '../../../routes/pages';
import { IEntryDetail } from '../../../utils/interfaces/entry';
import { ILicense, LICENSE_STATE } from '../../../utils/interfaces/license';

/**
 * One publication, cached once for the dialog, the publication page and the reader (React Query).
 * Opening a book from a list therefore costs no request when the card was hovered (`prefetchEntry`), and
 * the reader starts from the detail it was opened from instead of fetching it again.
 *
 * The detail carries per-reader fields (shelf record, reservation), so the cache is cleared on logout.
 */
const catalogOf = (catalogId?: string | null) => catalogId || config.ELVIRA_CATALOG_ID;

export const entryDetailKey = (entryId: string, catalogId?: string | null) =>
  ['entry-detail', catalogOf(catalogId), entryId] as const;

export const fetchEntryDetail = async (entryId: string, catalogId?: string | null, signal?: AbortSignal) => {
  const { data } = await baseAxios.get<{ response: IEntryDetail }>(
    `/api/v1/catalogs/${catalogOf(catalogId)}/entries/${encodeURIComponent(entryId)}`,
    { signal },
  );
  return data.response;
};

export const entryDetailQuery = (entryId: string, catalogId?: string | null) =>
  queryOptions({
    queryKey: entryDetailKey(entryId, catalogId),
    queryFn: ({ signal }) => fetchEntryDetail(entryId, catalogId, signal),
    staleTime: 60_000,
    // A 403/404 is an answer, not a blip: no retry, so the fallback (borrow / not found) shows at once.
    retry: (count, error) => count < 1 && ![401, 403, 404].includes((error as { response?: { status?: number } })?.response?.status ?? 0),
  });

/** The reader's live loan (active, or ready and not yet opened) of one publication, or null. */
export const entryLicenseQuery = (entryId: string, userId: string | null | undefined) =>
  queryOptions({
    queryKey: ['entry-license', userId ?? '', entryId] as const,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ user_id: userId ?? '', entry_id: entryId, paginate: 'false' });
      const { data } = await baseAxios.get<{ items: ILicense[] }>('/readium/v1/licenses', { params, signal });
      const now = new Date();
      return (
        data.items.find((l) => {
          if (l.state === LICENSE_STATE.active) return !l.expires_at || new Date(l.expires_at) > now;
          return l.state === LICENSE_STATE.ready;
        }) ?? null
      );
    },
    enabled: !!userId,
    staleTime: 15_000,
  });

/** Warm the cache for a publication the reader is about to open (hover, focus, touch). Never throws. */
export const prefetchEntry = (entryId: string, catalogId?: string | null) => {
  void queryClient.prefetchQuery(entryDetailQuery(entryId, catalogId));
  // …and the dialog's code (its own chunk), so the first open doesn't wait for it either.
  preloadEntryDialog();
};

/** After a change to a publication (shelf, review, loan): refetch wherever it is shown. */
export const invalidateEntry = (entryId: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['entry-detail'], predicate: (q) => q.queryKey[2] === entryId }),
    queryClient.invalidateQueries({ queryKey: ['entry-license'], predicate: (q) => q.queryKey[2] === entryId }),
  ]);

/** HTTP status of a failed request, if it had one. */
export const httpStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;
