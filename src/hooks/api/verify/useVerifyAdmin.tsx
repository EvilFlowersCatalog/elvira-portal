import { IVerifyAdminResponse } from '../../../utils/interfaces/auth';
import useAuth from '../../contexts/useAuthContext';
import useAxios from '../useAxios';

const useVerifyAdmin = () => {
  const { auth } = useAuth();
  const axios = useAxios();

  const verifyAdmin = async (): Promise<boolean> => {
    // Get info about user
    const VERIFY_URL = `/api/v1/users/${auth?.userId}`;
    const { data: user } = await axios.get<IVerifyAdminResponse>(VERIFY_URL);

    // return response
    return user.response.is_superuser;
  };

  return verifyAdmin;
};

export default useVerifyAdmin;
