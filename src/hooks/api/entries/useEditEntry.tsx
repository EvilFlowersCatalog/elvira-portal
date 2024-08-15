import { IEntryNew } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

const useEditEntry = () => {
  const axios = useAxios();

  const editEntry = async (entryId: string, editedEntry: IEntryNew) => {
    const EDIT_ENTRY_URL = `/api/v1/catalogs/${
      import.meta.env.ELVIRA_CATALOG_ID
    }/entries/${entryId}`;
    await axios.put(EDIT_ENTRY_URL, editedEntry);
  };
  return editEntry;
};

export default useEditEntry;
