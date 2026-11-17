import { IEntryNew } from '../../../utils/interfaces/entry';
import { config } from '@/lib/config';
import useAxios from '../useAxios';

const useEditEntry = () => {
  const axios = useAxios();

  const editEntry = async (entryId: string, editedEntry: IEntryNew, catalogId?: string) => {
    const effectiveCatalogId = catalogId || config.ELVIRA_CATALOG_ID;
    const EDIT_ENTRY_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;
    await axios.put(EDIT_ENTRY_URL, editedEntry);
  };
  return editEntry;
};

export default useEditEntry;
