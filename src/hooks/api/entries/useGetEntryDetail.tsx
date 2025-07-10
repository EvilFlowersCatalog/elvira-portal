import { IEntryDetail } from '../../../utils/interfaces/entry';
import useAxios from '../useAxios';

const useGetEntryDetail = () => {
  const axios = useAxios();

  const getEntryDetail = async (entryId: string): Promise<IEntryDetail> => {
    const ENTRY_DETAIL_URL = `/api/v1/catalogs/${import.meta.env.ELVIRA_CATALOG_ID}/entries/${entryId}`;
    // Get entry detail
    const { data: entryDetail } = await axios.get<{ response: IEntryDetail }>(ENTRY_DETAIL_URL);
    // return
    return entryDetail.response;
  };

  return getEntryDetail;
};

export default useGetEntryDetail;
