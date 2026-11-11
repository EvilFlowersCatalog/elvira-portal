import { useQuery } from '@tanstack/react-query';
import useAuthContext from '../../contexts/useAuthContext';
import { useGetCatalogDetail } from './useAdminCatalogs';

/**
 * The catalog this portal deployment serves (`ELVIRA_CATALOG_ID`). Readers need
 * its `url_name` to build OPDS addresses. Only fetched when signed in: the help
 * pages are public and the catalog detail is not. Shares its cache key with the
 * admin feed drawer, which reads the same detail.
 */
const useCurrentCatalog = () => {
  const { auth } = useAuthContext();
  const getCatalogDetail = useGetCatalogDetail();
  const catalogId: string | undefined = import.meta.env.ELVIRA_CATALOG_ID || undefined;

  return useQuery({
    queryKey: ['catalog', catalogId],
    queryFn: () => getCatalogDetail(catalogId as string),
    enabled: !!auth && !!catalogId,
    staleTime: Infinity,
    retry: false,
  });
};

export default useCurrentCatalog;
