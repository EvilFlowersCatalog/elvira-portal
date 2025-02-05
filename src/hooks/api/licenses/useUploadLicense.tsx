import { ILicenseNew } from '../../../utils/interfaces/licenses';
import useAxios from '../useAxios';

const useUploadLicense = () => {
  const axios = useAxios();

  const uploadLicense = async (license: ILicenseNew) => {
    const UPLOAD_LICENSE_URL = '/readium/v1/licenses';
    await axios.post(UPLOAD_LICENSE_URL, license);
  };

  return uploadLicense;
};

export default useUploadLicense;
