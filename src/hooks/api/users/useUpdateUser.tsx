import { IUser } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';

export interface IUpdateUserPayload {
  /** Required by the backend on every PUT. */
  name: string;
  surname: string;
  /** Optional partial changes. */
  is_active?: boolean;
  password?: string;
  lcp_passphrase?: string;
  lcp_passphrase_hint?: string;
}

const useUpdateUser = () => {
  const axios = useAxios();

  return async (userId: string, payload: IUpdateUserPayload): Promise<IUser> => {
    const { data } = await axios.put<{ response: IUser }>(`/api/v1/users/${userId}`, payload);
    return data?.response;
  };
};

export default useUpdateUser;
