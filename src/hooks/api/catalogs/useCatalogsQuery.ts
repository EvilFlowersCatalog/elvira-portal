import { useQuery } from '@tanstack/react-query';
import { ICatalogsList } from '../../../utils/interfaces/catalog';
import useAxios from '../useAxios';

/**
 * React Query reference implementation for a read endpoint.
 *
 * Compared to the legacy `useGetCatalogs` (which returns a bare async function
 * the caller must invoke and wrap in its own useEffect + error handling), this
 * hook gives every consumer shared caching, request de-duplication, retries and
 * `isLoading`/`isError` state out of the box. Follow this shape when migrating
 * other read hooks: stable `queryKey`, `useAxios()` inside `queryFn`.
 */
const useCatalogsQuery = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: ['catalogs'],
    queryFn: async (): Promise<ICatalogsList> => {
      const { data } = await axios.get<ICatalogsList>('/api/v1/catalogs');
      return data;
    },
  });
};

export default useCatalogsQuery;
