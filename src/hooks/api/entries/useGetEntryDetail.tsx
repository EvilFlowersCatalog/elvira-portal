import { IEntryDetail } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

const useGetEntryDetail = () => {
  const axios = useAxios();

  const getEntryDetail = async (entryId: string, catalogId?: string): Promise<IEntryDetail> => {
    // Use provided catalogId or fall back to env variable
    const effectiveCatalogId = catalogId || import.meta.env.ELVIRA_CATALOG_ID;
    const ENTRY_DETAIL_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;
    // Get entry detail
    const { data: entryDetail } = await axios.get<{ response: IEntryDetail }>(ENTRY_DETAIL_URL);
    // return
    return entryDetail.response;
  };

  return getEntryDetail;
};

export default useGetEntryDetail;
