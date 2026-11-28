import { useCallback, useEffect, useRef, useState } from 'react';
import { ExploreGraph } from '../../../../utils/func/exploreGraph';

/**
 * FEATURE: reading trail. The walk across the map (every focus, in order) as something to keep:
 * drawn on the map, saved in this browser, shared as a link (`?trail=id,id,…`).
 * Self-contained: this folder plus the `FEATURES.trail` lines in pages/common/Explore.tsx.
 * With the feature off, the hook still keeps the walk for the focus panel's back button.
 */
export interface SavedTrail {
  id: string;
  name: string;
  ids: string[];
  savedAt: string;
}

const STORE = 'elvira-explore-trails';
const MAX_STEPS = 30;
/** A link carries at most this many steps (UUIDs are long). */
const MAX_SHARED = 14;

const readStore = (): SavedTrail[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function useExploreTrail(graph: ExploreGraph | null, focusId: string | null, sharedParam: string | null) {
  const [trail, setTrail] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedTrail[]>(readStore);

  // A shared link opens with its walk already laid out.
  const loadedShared = useRef(false);
  useEffect(() => {
    if (!graph || loadedShared.current) return;
    loadedShared.current = true;
    const ids = (sharedParam ?? '').split(',').filter((id) => graph.byId.has(id));
    if (ids.length) setTrail(ids);
  }, [graph, sharedParam]);

  // Every focus is a step; stepping back to the previous one undoes it. Leaving focus keeps the walk.
  useEffect(() => {
    if (!focusId) return;
    setTrail((prev) => {
      if (prev[prev.length - 1] === focusId) return prev;
      if (prev[prev.length - 2] === focusId) return prev.slice(0, -1);
      return [...prev.slice(-(MAX_STEPS - 1)), focusId];
    });
  }, [focusId]);

  const persist = (next: SavedTrail[]) => {
    setSaved(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      // Private window or full storage: the trail stays for this visit only.
    }
  };

  const save = useCallback(
    (name: string) => {
      if (trail.length < 2) return;
      persist([{ id: String(Date.now()), name, ids: trail, savedAt: new Date().toISOString() }, ...readStore()].slice(0, 20));
    },
    [trail]
  );
  const remove = useCallback((id: string) => persist(readStore().filter((s) => s.id !== id)), []);
  const load = useCallback((ids: string[]) => setTrail(ids.filter((id) => graph?.byId.has(id))), [graph]);
  const clear = useCallback(() => setTrail(focusId ? [focusId] : []), [focusId]);

  const shareUrl = useCallback(() => {
    const ids = trail.slice(-MAX_SHARED);
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('trail', ids.join(','));
    if (ids.length) url.searchParams.set('focus', ids[ids.length - 1]);
    return url.toString();
  }, [trail]);

  const inFocus = focusId && trail[trail.length - 1] === focusId;
  const previousId = inFocus && trail.length > 1 ? trail[trail.length - 2] : undefined;

  return { trail, previousId, saved, save, remove, load, clear, shareUrl };
}

export type ExploreTrailState = ReturnType<typeof useExploreTrail>;
