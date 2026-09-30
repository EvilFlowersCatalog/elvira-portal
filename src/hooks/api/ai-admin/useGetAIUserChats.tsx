import useAxios from '../useAxios';
import { ASSISTANT_URL } from '../assistant/assistantApi';

export interface IAIUserChat {
  chatId: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  startedAt: string;
  lastMessageAt: string;
}

const useGetAIUserChats = () => {
  const axios = useAxios();

  const getAIUserChats = async (userId: string): Promise<{chats: IAIUserChat[], total: number}> => {
    const response = await axios.get(`${ASSISTANT_URL}/admin/users/${userId}/chats`);
    return response.data;
  };

  return getAIUserChats;
};

export default useGetAIUserChats;
