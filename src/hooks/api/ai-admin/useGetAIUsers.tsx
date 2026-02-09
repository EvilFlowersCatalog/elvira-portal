import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

export interface IAIUser {
  id: string;
  username: string;
  totalChats: number;
  totalMessages: number;
  totalTokens: number;
  lastActivity: string | null;
  blocked: boolean;
  createdAt: string;
}

interface IAIUsersParams {
  page?: number;
  limit?: number;
}

const useGetAIUsers = () => {
  const { auth } = useAuth();

  const getAIUsers = async (options: IAIUsersParams = {}): Promise<{users: IAIUser[], total: number, page: number, limit: number, pages: number}> => {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());

    const response = await axios.get(`${import.meta.env.ELVIRA_ASSISTANT_URL}/admin/users?${params.toString()}`, {
      headers: {
        'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  return getAIUsers;
};

export default useGetAIUsers;
