import { IRefreshTokenResponse } from '../../../utils/interfaces/auth';
import useAuthContext from '../../useAuthContext';
import useAxios from '../axios/useAxios';

const useRefreshToken = () => {
  const { auth } = useAuthContext();
  const axios = useAxios();

  const refreshToken = async (): Promise<string> => {
    // Get new token
    const REFRESH_TOKEN_URL = '/api/v1/token/refresh';
    const { data: token } = await axios.post<IRefreshTokenResponse>(
      REFRESH_TOKEN_URL,
      { refresh: auth?.refreshToken }
    );

    // Return new token
    return token.response.access_token;
  };

  return refreshToken;
};

export default useRefreshToken;
