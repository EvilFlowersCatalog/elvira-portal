import {
  IAuthCredentials,
  ILoginResponse,
} from '../../../utils/interfaces/auth';
import { baseAxios } from '../useAxios';

const useVerifyCredentials = () => {
  const verifyCredentials = async (
    loginForm: IAuthCredentials
  ): Promise<ILoginResponse> => {
    // Get user data with given credentials
    const LOGIN_URL = '/api/v1/token';
    const { data: user } = await baseAxios.post<ILoginResponse>(
      LOGIN_URL,
      JSON.stringify(loginForm)
    );

    return user;
  };

  return verifyCredentials;
};

export default useVerifyCredentials;
