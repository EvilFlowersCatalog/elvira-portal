import { IEntryNew } from '../../../utils/interfaces/entry';
import useAxios from '../axios/useAxios';

const useUploadEntry = () => {
  const axios = useAxios();

  const uploadEntry = async (entry: IEntryNew) => {
    const UPLOAD_ENTRY_URL = `/api/v1/catalogs/${
      import.meta.env.ELVIRA_CATALOG_ID
    }/entries`;
    await axios.post(UPLOAD_ENTRY_URL, entry);
  };
  return uploadEntry;
};

export default useUploadEntry;
