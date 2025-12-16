import axios from 'axios';
import useAuth from '../../contexts/useAuthContext';
import { IChatMessage } from './useGetChatHistory';

export interface IChat {
  chatId: string;
  title: string;
  userId: string;
  entryId: string | null;
  messageCount: number;
  lastMessage: IChatMessage;
  startedAt: string;
}

const useGetUserChats = () => {
  const { auth } = useAuth();

  const getUserChats = async (): Promise<{chats: IChat[], total: number}> => {
    const response = await axios.get(`${import.meta.env.ELVIRA_ASSISTANT_URL}/user/chats?catalogId=${import.meta.env.ELVIRA_CATALOG_ID}`, {
      headers: {
        'Authorization': auth?.token ? `Bearer ${auth.token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  return getUserChats;
};

export default useGetUserChats;
