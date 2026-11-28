import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEntriesByIdsFetcher } from '../entries/useEntriesByIds';
import { ExploreGraph } from '../../../utils/func/exploreGraph';
import { IEntry } from '../../../utils/interfaces/entry';

/**
 * The catalog records of every publication on the Explore map (year, language, files, collections):
 * the map itself carries only titles. Asked for once, and only when a feature that needs it is on
 * (filters, collections); the lookup batches the ids.
 */
export default function useExploreEntries(graph: ExploreGraph | null, enabled: boolean) {
  const fetchByIds = useEntriesByIdsFetcher();
  const ids = useMemo(() => (graph ? graph.nodes.filter((n) => n.kind === 'entry').map((n) => n.id) : []), [graph]);
  return useQuery({
    queryKey: ['explore-entries', ids.length, ids[0]],
    enabled: enabled && ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => new Map<string, IEntry>((await fetchByIds(ids)).map((entry) => [entry.id, entry])),
  });
}
