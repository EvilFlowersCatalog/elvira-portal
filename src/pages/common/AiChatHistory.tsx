import { useEffect, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useGetUserChats, { IChat } from '../../hooks/api/assistant/useGetUserChats';
import useGetChatHistory from '../../hooks/api/assistant/useGetChatHistory';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { FiMessageSquare, FiPlus } from 'react-icons/fi';
import { AiMessage } from '../../providers/AppProvider';
import axios from 'axios';
import useAuth from '../../hooks/contexts/useAuthContext';

const AiChatHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { 
    setAiChatId, 
    setAiMessages,
    setAiBookCatalogs,
    setAiShowSuggestions,
    clearAiChat,
    umamiTrack ,
    selectedCatalogId
  } = useAppContext();
  const getUserChats = useGetUserChats();
  const getChatHistory = useGetChatHistory();


  const [chats, setChats] = useState<IChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const userChats = await getUserChats();
      setChats(userChats.chats);
    } catch (err) {
      setError(t('assistant.chatHistoryError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = async (chat: IChat) => {
    try {      
      // Resume the chat session on the backend
      await axios.post(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/resumechat`, {
        chatId: chat.chatId,
        apiKey: auth?.token || null,
        catalogId: selectedCatalogId || import.meta.env.ELVIRA_CATALOG_ID || undefined  // Use undefined instead of null for optional field
      });

      // Load chat history
      const history = await getChatHistory(chat.chatId);

      // Extract and merge all bookCatalogs from history
      const mergedBookCatalogs: Record<string, string> = {};
      history.messages.forEach(msg => {
        if (msg.bookCatalogs) {
          Object.assign(mergedBookCatalogs, msg.bookCatalogs);
        }
      });

      // Transform history to AiMessage format
      const messages: AiMessage[] = history.messages.map((msg, index) => {
        if (msg.bookIds && msg.bookIds.length > 0) {
          return {
            role: msg.sender,
            content: {
              type: 'entries',
              data: msg.bookIds
            },
            id: `history-${index}`
          };
        }
        return {
          role: msg.sender,
          content: {
            type: 'message',
            data: msg.text
          },
          id: `history-${index}`
        };
      });

      // Set the chat state
      setAiChatId(chat.chatId);
      setAiMessages(messages);
      setAiBookCatalogs(mergedBookCatalogs);
      setAiShowSuggestions(false);

      // Navigate to assistant page
      navigate(NAVIGATION_PATHS.aiAssistant);
    } catch (err) {
      console.error('Failed to resume chat:', err);
    }
  };

  const handleNewChat = () => {
    umamiTrack("Start New AI Chat");
    clearAiChat();
    navigate(NAVIGATION_PATHS.aiAssistant);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('assistant.today');
    } else if (diffDays === 1) {
      return t('assistant.yesterday');
    } else if (diffDays < 7) {
      return t('assistant.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <CircleLoader color={'var(--color-primary)'} size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 p-6 overflow-auto">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-[2.125rem] leading-tight font-bold text-black dark:text-white">
            {t('assistant.chatHistory')}
          </h1>
          <button
            type="button"
            aria-label={t('assistant.newChat')}
            onClick={handleNewChat}
            className="inline-flex items-center justify-center rounded-full p-2 bg-primary text-onPrimary hover:bg-primaryDark transition-colors"
          >
            <FiPlus size={24} />
          </button>
        </div>

        {/* Chat List */}
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiMessageSquare size={64} className="text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              {t('assistant.noChats')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              {t('assistant.startFirstChat')}
            </p>
            <button
              onClick={handleNewChat}
              className="bg-primary text-onPrimary px-6 py-3 rounded-lg hover:bg-primaryDark transition-colors mt-5"
            >
              {t('assistant.newChat')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => handleChatClick(chat)}
                className="cursor-pointer rounded-lg bg-white dark:bg-[#27272a] shadow-[0px_2px_1px_-1px_rgba(0,0,0,0.2),0px_1px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.12)] transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-black dark:text-white mb-1">
                        {chat.title || t('assistant.untitledChat')}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {chat.lastMessage.text}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                        <span>{t('assistant.messages', { count: chat.messageCount })}</span>
                        <span>•</span>
                        <span>{formatDate(chat.lastMessage.timestamp)}</span>
                      </div>
                    </div>
                    <FiMessageSquare size={24} className="text-gray-400 dark:text-gray-600 ml-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatHistory;
