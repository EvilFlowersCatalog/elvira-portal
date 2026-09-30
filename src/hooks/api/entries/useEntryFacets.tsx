import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IEntryFacets } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';
import { AVAILABILITY_TO_LCP_STATE, buildEntryFilterParams, EntryFilters } from './entryFilters';

export interface IEntryFacetCounts {
  /** Entry counts keyed by category / feed id and by language code */
  categoryCounts: Record<string, number>;
  feedCounts: Record<string, number>;
  languageCounts: Record<string, number>;
  /** Entry counts keyed by sidebar availability state (available / unavailable / borrowed / reserved) */
  availabilityCounts: Record<string, number>;
  /** Publication year range of the entries the other filters leave (null when none has a year) */
  years: { min: number | null; max: number | null };
  /** true once counts for the current filters have loaded */
  ready: boolean;
  /** true when the facets request failed — callers should fall back to showing every option */
  failed: boolean;
}

const toCounts = <T extends { count: number }>(rows: T[], key: (row: T) => string) =>
  Object.fromEntries(rows.map((row) => [key(row), row.count]));

/**
 * Exact per-value counts for the advanced-search sidebar. The backend counts each
 * dimension with every active filter applied except its own, so a selected
 * language still lists the other languages that could be OR-ed in.
 */
const useEntryFacets = (filters: EntryFilters, options?: { enabled?: boolean }): IEntryFacetCounts => {
  const axios = useAxios();
  // Ordering doesn't change the counts — keep it out of the key so sorting doesn't refetch.
  const facetFilters: EntryFilters = { ...filters, orderBy: undefined };

  const { data, isSuccess, isError } = useQuery({
    queryKey: ['entry-facets', facetFilters],
    queryFn: async () => {
      const { data } = await axios.get<{ response: IEntryFacets }>('/api/v1/entries/facets', {
        params: buildEntryFilterParams(facetFilters),
      });
      return data.response;
    },
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

  return useMemo(() => {
    // The backend counts raw `lcp_state` values; sum them into the sidebar's states
    // with the same mapping the filter uses.
    const lcpCounts = toCounts(data?.availability ?? [], (row) => row.state);
    const availabilityCounts = Object.fromEntries(
      Object.entries(AVAILABILITY_TO_LCP_STATE).map(([state, lcpStates]) => [
        state,
        lcpStates.reduce((sum, lcpState) => sum + (lcpCounts[lcpState] ?? 0), 0),
      ])
    );

    return {
      categoryCounts: toCounts(data?.categories ?? [], (row) => row.id),
      feedCounts: toCounts(data?.feeds ?? [], (row) => row.id),
      languageCounts: toCounts(data?.languages ?? [], (row) => row.code),
      availabilityCounts,
      years: { min: data?.years?.min ?? null, max: data?.years?.max ?? null },
      ready: isSuccess,
      failed: isError,
    };
  }, [data, isSuccess, isError]);
};

export default useEntryFacets;
