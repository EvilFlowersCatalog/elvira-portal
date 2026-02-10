import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

export interface IAIUserChat {
  chatId: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  startedAt: string;
  lastMessageAt: string;
}

const useGetAIUserChats = () => {
  const { auth } = useAuth();

  const getAIUserChats = async (userId: string): Promise<{chats: IAIUserChat[], total: number}> => {
    const response = await axios.get(`${import.meta.env.ELVIRA_ASSISTANT_URL}/admin/users/${userId}/chats`, {
      headers: {
        'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  return getAIUserChats;
};

export default useGetAIUserChats;
