import {
  IUserAcquisition,
  IUserAcquisitionResponse,
  IUserAcquisitionShare,
} from '../../../../utils/interfaces/acquisition';
import useAxios from '../../useAxios';

const useCreateUserAcquisition = () => {
  const axios = useAxios();

  const createUserAcquisition = async (
    userAcquisition: IUserAcquisition | IUserAcquisitionShare
  ): Promise<IUserAcquisitionResponse> => {
    // Create user acquistion
    const CREATE_USER_ACQUISITION_URL = '/api/v1/user-acquisitions';
    const { data: info } = await axios.post<{response: IUserAcquisitionResponse}>(
      CREATE_USER_ACQUISITION_URL,
      userAcquisition
    );

    // return whatever response
    return info.response;
  };

  return createUserAcquisition;
};

export default useCreateUserAcquisition;
