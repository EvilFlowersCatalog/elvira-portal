import { IUser } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';

export interface ICreateUserPayload {
  username: string;
  name: string;
  surname: string;
  password: string;
  is_active?: boolean;
  lcp_passphrase?: string;
  lcp_passphrase_hint?: string;
}

const useCreateUser = () => {
  const axios = useAxios();

  return async (payload: ICreateUserPayload): Promise<IUser> => {
    const { data } = await axios.post<{ response: IUser }>('/api/v1/users', payload);
    return data.response;
  };
};

export default useCreateUser;
