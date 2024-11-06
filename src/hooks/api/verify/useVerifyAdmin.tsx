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

    const isSuperUser =
      user.response.is_superuser ||
      user.response.catalog_permissions[import.meta.env.ELVIRA_CATALOG_ID] ===
        'manage';
    // return response
    return isSuperUser;
  };

  return verifyAdmin;
};

export default useVerifyAdmin;
