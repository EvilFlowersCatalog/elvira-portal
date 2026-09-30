import { IAssistantChatDetail } from '../../../utils/interfaces/assistant';
import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

/** Loads a chat with its full message history (turns are stateless — this is how a chat is resumed). */
const useGetChatHistory = () => {
  const axios = useAxios();

  const getChatHistory = async (chatId: string): Promise<IAssistantChatDetail> => {
    const { data } = await axios.get<{ response: IAssistantChatDetail }>(`${ASSISTANT_URL}/chats/${chatId}`);
    return data.response;
  };

  return getChatHistory;
};

export default useGetChatHistory;
