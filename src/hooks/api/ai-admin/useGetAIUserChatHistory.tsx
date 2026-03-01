import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

export interface IAIChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  tokenUsage?: number;
}

const useGetAIUserChatHistory = () => {
  const { auth } = useAuth();

  const getAIUserChatHistory = async (userId: string, chatId: string): Promise<{history: IAIChatMessage[], chatId: string, messageCount: number}> => {
    const response = await axios.get(`${import.meta.env.ELVIRA_ASSISTANT_URL}/admin/users/${userId}/chats/${chatId}`, {
      headers: {
        'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  return getAIUserChatHistory;
};

export default useGetAIUserChatHistory;
