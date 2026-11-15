import useAppContext from '../../contexts/useAppContext';
import { fromApiMessages, subjectOf } from '../../../utils/func/assistantMessages';
import useGetChatHistory from './useGetChatHistory';

/**
 * Opens a stored chat in the shared assistant state. Turns are stateless, so resuming a chat is just loading its
 * history (and the publication it is about). Rejects when the history can't be loaded.
 */
const useResumeChat = () => {
  const { setAiChatId, setAiMessages, setAiChatSubject, setAiShowSuggestions } = useAppContext();
  const getChatHistory = useGetChatHistory();

  return async (chatId: string) => {
    const history = await getChatHistory(chatId);
    setAiChatId(chatId);
    setAiMessages(fromApiMessages(history.messages));
    setAiChatSubject(subjectOf(history));
    setAiShowSuggestions(false);
  };
};

export default useResumeChat;
