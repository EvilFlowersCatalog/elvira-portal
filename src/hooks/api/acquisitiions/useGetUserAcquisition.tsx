import { AxiosResponse } from 'axios';
import useAxios from '../axios/useAxios';

const useGetUserAcquisition = () => {
  const axios = useAxios();

  const getUserAcquisition = async (
    userAcquisitionId: string
  ): Promise<AxiosResponse<Promise<any>>> => {
    // Get user acquistion
    const USER_ACQUISITION_URL = `/data/v1/user-acquisitions/${userAcquisitionId}`;
    return await axios.get(USER_ACQUISITION_URL, {
      responseType: 'arraybuffer',
      transformResponse: [
        async function (data): Promise<any> {
          const blob = new Blob([data], { type: 'application/pdf' });

          const typedArray = new Uint8Array(await blob.arrayBuffer());
          return typedArray;
        },
      ],
    });
  };

  return getUserAcquisition;
};

export default useGetUserAcquisition;
