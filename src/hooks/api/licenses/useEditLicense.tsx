import { ILicenseEdit } from '../../../utils/interfaces/licenses';
import useAxios from '../useAxios';

const useEditLicense = () => {
  const axios = useAxios();

  const editLicense = async (license_id: string, payload: ILicenseEdit) => {
    const EDIT_LICENSE_URL = `/readium/v1/licenses/${license_id}`;
    await axios.put(EDIT_LICENSE_URL, payload);
  };

  return editLicense;
};

export default useEditLicense;
