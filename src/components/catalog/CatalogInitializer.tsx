import { useEffect } from 'react';
import useGetCatalogs from '../../hooks/api/catalogs/useGetCatalogs';
import useAppContext from '../../hooks/contexts/useAppContext';
import { ICatalog } from '../../utils/interfaces/catalog';
import { ICatalogOption } from '../../providers/AppProvider';

/**
 * Component that fetches and initializes available catalogs from the API
 * Must be rendered within AuthProvider to have authentication available
 */
const CatalogInitializer = () => {
  const getCatalogs = useGetCatalogs();
  const { initializeCatalogs } = useAppContext();

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await getCatalogs();
        const catalogOptions: ICatalogOption[] = response.items.map((catalog: ICatalog) => ({
          label: catalog.title,
          value: catalog.url_name,
          catalogId: catalog.id,
        }));
        
        initializeCatalogs(catalogOptions);
      } catch (error) {
        console.error('Failed to fetch catalogs:', error);
        // Fail gracefully - AppProvider will use env fallback
      }
    };

    fetchCatalogs();
  }, []);

  // This component doesn't render anything
  return null;
};

export default CatalogInitializer;
