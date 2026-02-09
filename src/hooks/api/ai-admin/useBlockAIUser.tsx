import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

const useBlockAIUser = () => {
  const { auth } = useAuth();

  const blockAIUser = async (userId: string, blocked: boolean): Promise<{success: boolean, message: string}> => {
    const response = await axios.post(`${import.meta.env.ELVIRA_ASSISTANT_URL}/admin/users/block`, 
      { userId, blocked },
      {
        headers: {
          'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  };

  return blockAIUser;
};

export default useBlockAIUser;
