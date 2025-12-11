import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';

export interface IChatMessage {
  id: string;
  chatId: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const useGetChatHistory = () => {
  const { auth } = useAuth();

  const getChatHistory = async (chatId: string): Promise<{chatId:string, messagesCount: number, messages: IChatMessage[]}> => {
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
