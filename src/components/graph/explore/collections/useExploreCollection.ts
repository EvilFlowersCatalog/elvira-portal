import { useMemo, useState } from 'react';
import useExploreEntries from '../../../../hooks/api/graph/useExploreEntries';
import { ExploreGraph, readNext } from '../../../../utils/func/exploreGraph';
import { LocalizedText } from '../../../../utils/interfaces/general/general';

/**
 * FEATURE: collection ("syllabus") view. Pick one of the library's collections: its publications
 * are lit on the map, what lies closest to them by content is half lit, the rest is dimmed.
 * Self-contained: this folder plus the `FEATURES.collections` lines in pages/common/Explore.tsx.
 */
export interface ExploreCollection {
  id: string;
  title: LocalizedText | string;
  /** Its publications that are on the map. */
  ids: string[];
}

export default function useExploreCollection(graph: ExploreGraph | null, enabled: boolean) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: entries, isLoading } = useExploreEntries(graph, enabled);

  const collections = useMemo(() => {
    const found = new Map<string, ExploreCollection>();
    entries?.forEach((entry) => {
      entry.feeds?.forEach((feed) => {
        const row = found.get(feed.id) ?? { id: feed.id, title: feed.title, ids: [] };
        row.ids.push(entry.id);
        found.set(feed.id, row);
      });
    });
    return [...found.values()].sort((a, b) => b.ids.length - a.ids.length);
  }, [entries]);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  const view = useMemo(() => {
    if (!graph || !selected) return null;
    const lit = new Set(selected.ids);
    // What surrounds the collection: publications outside it, closest to its own first.
    const around = readNext(graph, lit, 40);
    return { lit, near: new Set(around.map((a) => a.id)), around };
  }, [graph, selected]);

  return { collections, selected, select: setSelectedId, view, entries, loading: isLoading };
}

export type ExploreCollectionState = ReturnType<typeof useExploreCollection>;
