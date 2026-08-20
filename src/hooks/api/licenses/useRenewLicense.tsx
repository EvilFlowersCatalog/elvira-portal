import useAxios from '../useAxios';
import { ILicense, LICENSE_ACTION } from '../../../utils/interfaces/licenses';

const useRenewLicense = () => {
  const axios = useAxios();

  const renewLicense = async (licenseId: string, requested_end: string): Promise<ILicense> => {
    const { data } = await axios.put<ILicense>(
      `/readium/v1/licenses/${licenseId}`,
      { action: LICENSE_ACTION.renewed, requested_end },
    );
    return data;
  };

  return renewLicense;
};

export default useRenewLicense;
