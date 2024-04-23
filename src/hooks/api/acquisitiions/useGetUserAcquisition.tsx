import { IUserAcquisitionData } from '../../../utils/interfaces/acquisition';
import useAxios from '../axios/useAxios';

const useGetUserAcquisition = () => {
  const axios = useAxios();

  const getUserAcquisition = async (
    userAcquisitionId: string,
    format: string = ''
  ): Promise<IUserAcquisitionData> => {
    // Get user acquistion
    const USER_ACQUISITION_URL = `/data/v1/user-acquisitions/${userAcquisitionId}`;
    const { data: userAcquistion } = await axios.get<IUserAcquisitionData>(
      USER_ACQUISITION_URL,
      { params: { format } }
    );

    return userAcquistion;
  };

  return getUserAcquisition;
};

export default useGetUserAcquisition;
