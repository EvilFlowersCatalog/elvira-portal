import { useEffect } from 'react';
import useCatalogsQuery from '../../hooks/api/catalogs/useCatalogsQuery';
import useAppContext from '../../hooks/contexts/useAppContext';
import { ICatalog } from '../../utils/interfaces/catalog';
import { ICatalogOption } from '../../providers/AppProvider';

/**
 * Fetches available catalogs from the API and seeds them into AppContext.
 * Must be rendered within AuthProvider so authentication is available.
 *
 * Uses `useCatalogsQuery` (React Query) for the fetch — caching, de-duplication
 * and retries are handled by the query; this component only maps the result
 * into the shape AppContext expects once it arrives.
 */
const CatalogInitializer = () => {
  const { data, isError, error } = useCatalogsQuery();
  const { initializeCatalogs } = useAppContext();

  useEffect(() => {
    if (!data) return;

    const catalogOptions: ICatalogOption[] = data.items.map(
      (catalog: ICatalog) => ({
        label: catalog.title,
        value: catalog.url_name,
        catalogId: catalog.id,
      })
    );

    initializeCatalogs(catalogOptions);
    // initializeCatalogs is stable enough; re-run only when the data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    // Fail gracefully — AppProvider falls back to the env-configured catalog.
    if (isError) console.error('Failed to fetch catalogs:', error);
  }, [isError, error]);

  // This component doesn't render anything.
  return null;
};

export default CatalogInitializer;
