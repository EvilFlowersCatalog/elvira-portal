import { IAssistantChatDetail, IAssistantMessage } from '../../../utils/interfaces/assistant';
import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

type RawMessage = Partial<IAssistantMessage> & { message?: string; text?: string; entries?: string[] };
type RawChat = Omit<IAssistantChatDetail, 'messages'> & { messages?: RawMessage[] };

/** Loads a chat with its full message history (turns are stateless — this is how a chat is resumed). */
const useGetChatHistory = () => {
  const axios = useAxios();

  const getChatHistory = async (chatId: string): Promise<IAssistantChatDetail> => {
    const { data } = await axios.get<RawChat | { response: RawChat }>(`${ASSISTANT_URL}/chats/${chatId}`);
    // Like start-chat, the payload may come wrapped in `response`.
    const chat = 'response' in data ? data.response : data;

    return {
      ...chat,
      messages: (chat.messages ?? []).map((m) => ({
        ...m,
        content: m.content ?? m.message ?? m.text ?? '',
        entry_ids: m.entry_ids ?? m.entries,
      })) as IAssistantMessage[],
    };
  };

  return getChatHistory;
};

export default useGetChatHistory;
