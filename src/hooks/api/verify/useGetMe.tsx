import { IGetMeResponse } from '../../../utils/interfaces/auth';
import { baseAxios } from '../useAxios';

const useGetMe = () => {
  const getMe = async (): Promise<IGetMeResponse> => {
    // Get current user data
    const GET_ME_URL = '/api/v1/users/me';
    const { data: user } = await baseAxios.get<IGetMeResponse>(GET_ME_URL);

    return user;
  };

  return getMe;
};

export default useGetMe;
