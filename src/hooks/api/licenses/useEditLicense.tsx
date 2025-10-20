import { ILicenseEdit } from '../../../utils/interfaces/licenses';
import useAxios from '../useAxios';

const useEditLicense = () => {
  const axios = useAxios();

  const editLicense = async (license_id: string, license: ILicenseEdit) => {
    const EDIT_LICENSE_URL = `/readium/v1/licenses/${license_id}`;
    await axios.put(EDIT_LICENSE_URL, license);
  };

  return editLicense;
};

export default useEditLicense;
