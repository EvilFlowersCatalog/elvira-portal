import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, IconButton } from '@mui/material';
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
    setAiShowSuggestions,
    clearAiChat,
    umamiTrack 
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
        catalogId: import.meta.env.ELVIRA_CATALOG_ID || null
      });

      // Load chat history
      const history = await getChatHistory(chat.chatId);

      // Transform history to AiMessage format
      const messages: AiMessage[] = history.messages.map((msg, index) => {
        // if (msg.entryIds && msg.entryIds.length > 0) {
        //   return {
        //     role: msg.role,
        //     content: {
        //       type: 'entries',
        //       data: msg.entryIds
        //     },
        //     id: `history-${index}`
        //   };
        // }
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
      <Box className="flex items-center justify-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex items-center justify-center h-full">
        <Typography className="text-red-500">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 p-6">
      <Box className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h4" className="font-bold text-black dark:text-white">
            {t('assistant.chatHistory')}
          </Typography>
          <IconButton 
            onClick={handleNewChat}
            className="bg-primary text-white hover:bg-primary-dark"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <FiPlus size={24} />
          </IconButton>
        </Box>

        {/* Chat List */}
        {chats.length === 0 ? (
          <Box className="flex flex-col items-center justify-center py-20">
            <FiMessageSquare size={64} className="text-gray-400 dark:text-gray-600 mb-4" />
            <Typography variant="h6" className="text-gray-600 dark:text-gray-400 mb-2">
              {t('assistant.noChats')}
            </Typography>
            <Typography variant="body2" className="text-gray-500 dark:text-gray-500 mb-6">
              {t('assistant.startFirstChat')}
            </Typography>
            <button
              onClick={handleNewChat}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('assistant.newChat')}
            </button>
          </Box>
        ) : (
          <Box className="flex flex-col gap-3">
            {chats.map((chat) => (
              <Card
                key={chat.chatId}
                onClick={() => handleChatClick(chat)}
                className="cursor-pointer transition-all hover:shadow-lg"
                sx={{
                  backgroundColor: 'white',
                  '.dark &': {
                    backgroundColor: '#27272a',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <CardContent className="p-4">
                  <Box className="flex items-start justify-between">
                    <Box className="flex-1">
                      <Typography variant="h6" className="font-semibold text-black dark:text-white mb-1">
                        {chat.title || t('assistant.untitledChat')}
                      </Typography>
                      {chat.lastMessage && (
                        <Typography 
                          variant="body2" 
                          className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-2"
                        >
                          {chat.lastMessage.text}
                        </Typography>
                      )}
                      <Box className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                        <span>{t('assistant.messages', { count: chat.messageCount })}</span>
                        <span>•</span>
                        <span>{formatDate(chat.lastMessage.timestamp)}</span>
                      </Box>
                    </Box>
                    <FiMessageSquare size={24} className="text-gray-400 dark:text-gray-600 ml-4" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AiChatHistory;
