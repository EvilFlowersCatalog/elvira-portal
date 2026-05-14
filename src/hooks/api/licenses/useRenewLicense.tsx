import useAxios from '../useAxios';
import { ILicense } from '../../../utils/interfaces/licenses';

const useRenewLicense = () => {
  const axios = useAxios();

  const renewLicense = async (licenseId: string, duration: 'P7D' | 'P14D'): Promise<ILicense> => {
    const { data } = await axios.put<{ response: ILicense }>(
      `/readium/v1/licenses/${licenseId}`,
      { state: 'renewed', duration },
    );
    return data.response;
  };

  return renewLicense;
};

export default useRenewLicense;
