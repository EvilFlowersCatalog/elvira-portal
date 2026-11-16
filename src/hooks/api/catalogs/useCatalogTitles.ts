import { useQuery } from '@tanstack/react-query';
import { useListCatalogs } from './useAdminCatalogs';

/** Every catalog (one unpaginated request, cached for five minutes): for title lookups by id and catalog pickers. */
export const useCatalogTitles = () => {
  const listCatalogs = useListCatalogs();
  return useQuery({
    queryKey: ['catalogs', 'titles'],
    staleTime: 5 * 60_000,
    queryFn: async () => (await listCatalogs({ orderBy: 'title' })).items,
  });
};
