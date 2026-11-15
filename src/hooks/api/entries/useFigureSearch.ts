import { keepPreviousData, useQuery } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { buildEntryFilterParams, EntryFilters } from './entryFilters';

export type FigureKind = 'figure' | 'table';

/** One figure or table that matched (`GET /api/v1/search?kind=…`, EvilFlowersCatalog#159). */
export interface IFigureHit {
  entry_id: string;
  /** The publication's title. */
  title: string;
  /** Page of the original PDF, 1-based. */
  page: number;
  region_id: string;
  kind: FigureKind;
  /** The printed caption, else the model's description. */
  caption: string | null;
  description: string | null;
  score: number;
  /** `semantic`, `words`, or both. */
  matched: string[];
  /** The crop, behind the reader's access check (needs the token); null without a stored crop. */
  crop_url: string | null;
  /** Open access with printing and sharing allowed: a client may offer the crop for download. */
  downloadable: boolean;
}

export interface IFigureSearch {
  query: string;
  kinds: FigureKind[];
  /** The query could not be embedded: only word matches. */
  degraded: boolean;
  items: IFigureHit[];
}

/** The catalog's cap; the endpoint has no paging. */
export const FIGURE_SEARCH_LIMIT = 50;

/**
 * Figures and tables across the library: regions, not entries. Only publications the caller may see; LCP titles
 * only with a live loan. `filters` narrow the publications searched, as on `/api/v1/entries`.
 */
const useFigureSearch = (
  query: string,
  options?: { enabled?: boolean; kinds?: FigureKind[]; filters?: EntryFilters },
) => {
  const axios = useAxios();
  const kinds = options?.kinds?.length ? options.kinds : (['figure', 'table'] as FigureKind[]);
  const filters = options?.filters;

  return useQuery({
    queryKey: ['figure-search', query, kinds.join(','), filters ?? null],
    queryFn: async ({ signal }): Promise<IFigureSearch> => {
      const params = buildEntryFilterParams({ ...(filters ?? {}), query: '', orderBy: '' });
      params.set('q', query);
      params.set('kind', kinds.join(','));
      params.set('limit', String(FIGURE_SEARCH_LIMIT));
      const { data } = await axios.get<{ response: IFigureSearch }>('/api/v1/search', { params, signal });
      return data.response;
    },
    enabled: (options?.enabled ?? true) && query.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};

export default useFigureSearch;
