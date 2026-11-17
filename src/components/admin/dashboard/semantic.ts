import { useMemo } from 'react';
import { useLibraryMap } from '../../../hooks/api/graph/useGraph';
import useCategoriesQuery from '../../../hooks/api/categories/useCategoriesQuery';
import { useLocalize } from '../../../utils/func/localized';
import { ILibraryMap } from '../../../utils/interfaces/graph';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { buildSemanticIndex, SemanticIndex } from './semanticModel';
import { useFeature } from '../../../features/features';

export * from './semanticModel';

/** The graph routes (and /explore) only exist where the library graph feature is on. */
export const useSemanticsOn = () => useFeature('graph');

/**
 * The library map for the dashboard's semantic layer. Same cache key as Explore, so a visit
 * to either warms the other. Never throws into the page: a failure just hides the layer.
 */
export const useDashboardMap = () => {
  const on = useSemanticsOn();
  return useLibraryMap({ enabled: on, retry: false });
};

/** Joins the meaning-graph (all processed publications) with the lending stats (LCP titles only). */
export const useSemanticIndex = (
  map: ILibraryMap | undefined,
  titles: ITitleStatistics[],
  periodFrom: string | undefined
): SemanticIndex | null =>
  useMemo(
    () =>
      map?.nodes.length && periodFrom
        ? buildSemanticIndex(map, titles, periodFrom)
        : null,
    [map, titles, periodFrom]
  );

export interface SubjectNames {
  /** "004" → "Computer science"; falls back to the bare term. */
  label: (term: string | null) => string;
  /** Category id for a term, to open the filtered publication list. */
  idOf: (term: string | null) => string | undefined;
}

/** Human names for catalogue terms (the graph only carries the codes). */
export const useSubjectNames = (enabled: boolean): SubjectNames => {
  const categories = useCategoriesQuery({ paginate: false }, { enabled });
  const localize = useLocalize();
  return useMemo(() => {
    const byTerm = new Map(
      (categories.data?.items ?? []).map((c) => [c.term, c] as const)
    );
    return {
      label: (term) => {
        if (term == null) return '';
        const c = byTerm.get(term);
        return c ? localize(c.label) || term : term;
      },
      idOf: (term) => (term == null ? undefined : byTerm.get(term)?.id),
    };
  }, [categories.data, localize]);
};
