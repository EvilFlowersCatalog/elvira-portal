import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

export interface IChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  entryIds: string[] | null;
  createdAt: string;
}

const useGetChatHistory = () => {
  const { auth } = useAuth();

  const getChatHistory = async (chatId: string): Promise<IChatMessage[]> => {
    const response = await axios.get(`${import.meta.env.ELVIRA_ASSISTANT_URL}/user/chats/${chatId}`, {
      headers: {
        'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  return getChatHistory;
};

export default useGetChatHistory;
