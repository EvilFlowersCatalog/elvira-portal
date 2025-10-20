import { ILicenseDetail } from '../../../utils/interfaces/licenses';
import useAxios from '../useAxios';

const useGetLicenseDetail = () => {
  const axios = useAxios();

  const getLicenseDetail = async (
    license_id: string
  ): Promise<ILicenseDetail> => {
    const LICENSE_DETAIL_URL = `/readium/v1/licenses/${license_id}`;
    const { data: licenseDetail } = await axios.get<ILicenseDetail>(
      LICENSE_DETAIL_URL
    );

    return licenseDetail;
  };

  return getLicenseDetail;
};

export default useGetLicenseDetail;
