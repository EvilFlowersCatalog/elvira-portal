import useAxios from '../useAxios';
import useAppContext from '../../contexts/useAppContext';

const useCreateEntryAcquistion = () => {
  const axios = useAxios();
  const { selectedCatalogId } = useAppContext();

  const createEntryAcquisition = async (
    acquisition: FormData,
    entryId: string,
    catalogId?: string
  ) => {
    const effectiveCatalogId = catalogId || selectedCatalogId || import.meta.env.ELVIRA_CATALOG_ID;
    // Create user acquistion
    const CREATE_ENTRY_ACQUISITION_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;

    await axios.post(CREATE_ENTRY_ACQUISITION_URL, acquisition, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return createEntryAcquisition;
};

export default useCreateEntryAcquistion;
