import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { IEntryFacets, IEntrySearchMeta } from '../../utils/interfaces/entry';

interface PagedResponse<T> {
  items: T[];
  metadata: { pages: number; search?: IEntrySearchMeta | null };
  facets?: IEntryFacets | null;
}

/**
 * Shape consumed by `ItemContainer` (items, loading/error flags, page cursor and
 * the scroll-driven `setPage`). Produced by `useInfiniteItemContainer` below;
 * the setters other than `setPage`/`reset` are no-ops because React Query owns
 * that state.
 */
export interface IItemContainerList<T = any> {
  items: T[];
  setItems: (items: T[]) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  /** Background activity (refetch / next page / query-key change) — true while
   * fresh data loads even though stale items are still shown. */
  isFetching: boolean;
  isError: boolean;
  setIsError: (v: boolean) => void;
  page: number;
  setPage: (v: number) => void;
  maxPage: number;
  setMaxPage: (v: number) => void;
  loadingNext: boolean;
  setLoadingNext: (v: boolean) => void;
  reset: () => void;
  /** How the catalog answered the search (first page; entries lists with `query`). */
  search?: IEntrySearchMeta | null;
  /**
   * Facet counts sent with the first page (`include=facets`). `undefined` means the
   * list doesn't carry them and the sidebar has to fetch its own.
   */
  facets?: { data: IEntryFacets | null | undefined; ready: boolean; failed: boolean };
}

/**
 * React Query backing for the infinite-scroll pages (Library, Feeds, Shelf).
 * Returns the `IItemContainerList` shape `ItemContainer` consumes, so the
 * container and its `handleScroll` wiring are used unchanged — a page just calls
 * this hook instead of holding list state and a manual paginated fetch effect.
 *
 * Reset is driven by `queryKey`: put the active filters in the key (and leave
 * out params that shouldn't refetch, e.g. `entry-detail-id`) and changing them
 * restarts at page 1 automatically. `handleScroll` calls `setPage(page + 1)`,
 * which we translate into `fetchNextPage()`.
 */
export function useInfiniteItemContainer<T extends { id: string }>(
  queryKey: unknown[],
  fetchPage: (page: number, signal: AbortSignal) => Promise<PagedResponse<T>>,
  options?: { enabled?: boolean; withFacets?: boolean }
): IItemContainerList<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < (lastPage.metadata?.pages ?? 1)
        ? allPages.length + 1
        : undefined,
    enabled: options?.enabled ?? true,
    // When the queryKey changes (new search / filter / sort / catalog), keep the
    // previous result set on screen while the next one loads instead of wiping
    // the grid to a full-page skeleton. This is what removes the visible
    // "flash / blink" on every filter change: `isLoading` (isPending) only stays
    // true for the very first load, so ItemContainer renders the old items until
    // the fresh data arrives. `isFetching` still exposes the background activity.
    placeholderData: keepPreviousData,
  });

  // Flatten loaded pages and de-duplicate by id (the same guard the old manual
  // accumulation used, since overlapping pages can repeat an item).
  const items = useMemo<T[]>(() => {
    const all = (query.data?.pages ?? []).flatMap((p) => p.items);
    return Array.from(new Map(all.map((e) => [e.id, e])).values());
  }, [query.data]);

  const firstPage = query.data?.pages[0];
  const page = query.data?.pages.length ?? 0;
  const maxPage = firstPage?.metadata?.pages ?? 0;
  const noop = () => {};
  const facets = useMemo(
    () =>
      options?.withFacets
        ? { data: firstPage?.facets, ready: !!firstPage, failed: query.isError && !firstPage }
        : undefined,
    [options?.withFacets, firstPage, query.isError]
  );

  return {
    items,
    setItems: noop,
    isLoading: query.isLoading,
    setIsLoading: noop,
    isFetching: query.isFetching,
    isError: query.isError,
    setIsError: noop,
    page,
    // handleScroll bumps the page when near the bottom → load the next page.
    setPage: (p: number) => {
      if (p > page && query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
    maxPage,
    setMaxPage: noop,
    loadingNext: query.isFetchingNextPage,
    setLoadingNext: noop,
    // Filter-driven resets happen via queryKey change; `reset()` is the explicit
    // "refresh the current view" hook (e.g. Shelf after removing an item).
    reset: () => {
      query.refetch();
    },
    search: firstPage?.metadata?.search,
    facets,
  };
}

export default useInfiniteItemContainer;
