import { useMemo } from 'react';
import useEntriesQuery from './useEntriesQuery';

export interface IEntryFacets {
  /** entryId-count keyed by category / feed id and by language code */
  categoryCounts: Record<string, number>;
  feedCounts: Record<string, number>;
  languageCounts: Record<string, number>;
  /** true once the sample has loaded — until then callers should not filter */
  ready: boolean;
}

// No backend aggregation avaialble
const FACET_SAMPLE_LIMIT = 100;

const useEntryFacets = (): IEntryFacets => {
  const { data, isSuccess } = useEntriesQuery({ page: 1, limit: FACET_SAMPLE_LIMIT });

  return useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const feedCounts: Record<string, number> = {};
    const languageCounts: Record<string, number> = {};

    (data?.items ?? []).forEach((entry) => {
      entry.categories?.forEach((category) => {
        categoryCounts[category.id] = (categoryCounts[category.id] ?? 0) + 1;
      });
      entry.feeds?.forEach((feed) => {
        feedCounts[feed.id] = (feedCounts[feed.id] ?? 0) + 1;
      });
      if (entry.language_code) {
        languageCounts[entry.language_code] = (languageCounts[entry.language_code] ?? 0) + 1;
      }
    });

    return { categoryCounts, feedCounts, languageCounts, ready: isSuccess };
  }, [data, isSuccess]);
};

export default useEntryFacets;
