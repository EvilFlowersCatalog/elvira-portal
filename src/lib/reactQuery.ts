import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client.
 *
 * This is the incremental entry point for migrating the app's hand-rolled data
 * layer (60+ hooks that each return a bare async fetch function with no caching,
 * deduplication, retries or shared loading/error state) onto React Query.
 *
 * Migration pattern (see hooks/api/catalogs/useCatalogsQuery.ts for a worked
 * example): wrap an existing `useAxios()`-based fetch in `useQuery`, give it a
 * stable `queryKey`, and consumers get caching, request dedup, retries and
 * `isLoading`/`isError` for free. Old imperative hooks can be migrated one at a
 * time — both styles coexist.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30s before a background refetch is considered.
      staleTime: 30_000,
      // The axios response interceptor already handles 401 -> logout; avoid
      // hammering the API on genuine failures.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
