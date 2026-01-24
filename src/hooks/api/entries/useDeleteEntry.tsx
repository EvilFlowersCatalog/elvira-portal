import useAxios from '../useAxios';

const useDeleteEntry = () => {
  const axios = useAxios();

  const deleteEntry = async (entryId: string, catalogId?: string) => {
    const effectiveCatalogId = catalogId || import.meta.env.ELVIRA_CATALOG_ID;
    const DELETE_ENTRY_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;

    await axios.delete(DELETE_ENTRY_URL);
  };

  return deleteEntry;
};

export default useDeleteEntry;
