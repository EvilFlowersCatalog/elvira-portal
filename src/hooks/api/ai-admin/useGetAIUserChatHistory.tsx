import useAxios from '../useAxios';
import { ASSISTANT_URL } from '../assistant/assistantApi';

export interface IAIChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  tokenUsage?: number;
}

const useGetAIUserChatHistory = () => {
  const axios = useAxios();

  const getAIUserChatHistory = async (userId: string, chatId: string): Promise<{history: IAIChatMessage[], chatId: string, messageCount: number}> => {
    const response = await axios.get(`${ASSISTANT_URL}/admin/users/${userId}/chats/${chatId}`);
    return response.data;
  };

  return getAIUserChatHistory;
};

export default useGetAIUserChatHistory;
