import { IEntryDetail, IEntryNew } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

const useUploadEntry = () => {
  const axios = useAxios();

  const uploadEntry = async (entry: IEntryNew, catalogId?: string): Promise<IEntryDetail> => {
    const effectiveCatalogId = catalogId || import.meta.env.ELVIRA_CATALOG_ID;
    const UPLOAD_ENTRY_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries`;
    const { data } = await axios.post(UPLOAD_ENTRY_URL, entry);

    return data.response;
  };
  return uploadEntry;
};

export default useUploadEntry;
