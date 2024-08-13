import { IEntryDetail, IEntryNew } from '../../../utils/interfaces/entry';
import useAxios from '../axios/useAxios';

const useUploadEntry = () => {
  const axios = useAxios();

  const uploadEntry = async (entry: IEntryNew): Promise<IEntryDetail> => {
    const UPLOAD_ENTRY_URL = `/api/v1/catalogs/${
      import.meta.env.ELVIRA_CATALOG_ID
    }/entries`;
    const { data: response } = await axios.post(UPLOAD_ENTRY_URL, entry);

    return response;
  };
  return uploadEntry;
};

export default useUploadEntry;
