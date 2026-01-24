import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Alert } from '@mui/material';
import useGetCatalogs from '../../hooks/api/catalogs/useGetCatalogs';
import { ICatalog } from '../../utils/interfaces/catalog';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { MUISelectStyle } from '../inputs/ElviraSelect';

const CatalogSwitcher = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { selectedCatalogId, setSelectedCatalogId } = useAppContext();
  const getCatalogs = useGetCatalogs();
  
  const [catalogs, setCatalogs] = useState<ICatalog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCatalogs, setAvailableCatalogs] = useState<ICatalog[]>([]);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      const response = await getCatalogs();
      setCatalogs(response.items || []);
      
      // Filter catalogs based on user permissions
      if (auth) {
        const userCatalogs = response.items.filter((catalog) => {
          // Super users can see all catalogs
          if (auth.isSuperUser) return true;
          // Regular users can only see catalogs they have manage permission for
          // Note: This requires user.catalog_permissions to be available in auth
          return false; // Default to false if no permissions info
        });
        
        setAvailableCatalogs(userCatalogs);
        
        // Auto-select first available catalog if none selected
        if (!selectedCatalogId && userCatalogs.length > 0) {
          setSelectedCatalogId(userCatalogs[0].id);
        }
      }
    } catch (err) {
      setError(t('admin.catalog.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedCatalogId(event.target.value);
  };

  if (loading) {
    return <div className="mb-8 px-2 text-gray-600 dark:text-gray-400">{t('administration.catalog.loading')}</div>;
  }

  if (error || availableCatalogs.length === 0) {
    return (
      <Alert severity="error" className="mb-8 mx-2">
        {error || t('administration.catalog.noCatalogs')}
      </Alert>
    );
  }

  return (
    <div className="mb-8 px-4 py-4 max-w-lg">
      <FormControl fullWidth variant="standard">
        <InputLabel id="catalog-select-label" className="dark:text-white">
          {t('administration.catalog.select')}
        </InputLabel>
        <Select
          labelId="catalog-select-label"
          sx={MUISelectStyle}
          id="catalog-select"
          className='dark:text-white'
          value={selectedCatalogId || ''}
          label={t('administration.catalog.select')}
          onChange={handleChange}
        >
          {availableCatalogs.map((catalog) => (
            <MenuItem key={catalog.id} value={catalog.id}>
              {catalog.title} ({catalog.url_name})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default CatalogSwitcher;
