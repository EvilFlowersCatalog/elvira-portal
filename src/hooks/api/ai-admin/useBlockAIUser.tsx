import useAxios from '../useAxios';
import { ASSISTANT_URL } from '../assistant/assistantApi';

const useBlockAIUser = () => {
  const axios = useAxios();

  const blockAIUser = async (userId: string, blocked: boolean): Promise<{success: boolean, message: string}> => {
    const response = await axios.post(`${ASSISTANT_URL}/admin/users/block`, { userId, blocked });
    return response.data;
  };

  return blockAIUser;
};

export default useBlockAIUser;
