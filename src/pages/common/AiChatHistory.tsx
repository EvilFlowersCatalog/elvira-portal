import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IAssistantChat } from '../../utils/interfaces/assistant';
import useUserChatsQuery from '../../hooks/api/assistant/useUserChatsQuery';
import useGetChatHistory from '../../hooks/api/assistant/useGetChatHistory';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { FiMessageSquare, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AiMessage } from '../../providers/AppProvider';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import useDeleteChat from '../../hooks/api/assistant/useDeleteChat';

function ChatRowSkeleton() {
  return (
    <div className="rounded-lg bg-zinc-300 dark:bg-darkGray animate-pulse">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-5 w-1/2 rounded-md bg-zinc-400 dark:bg-strongDarkGray" />
            <div className="h-4 w-3/4 rounded-md bg-zinc-400 dark:bg-strongDarkGray" />
            <div className="flex items-center gap-4 mt-1">
              <div className="h-3 w-16 rounded-md bg-zinc-400 dark:bg-strongDarkGray" />
              <div className="h-3 w-20 rounded-md bg-zinc-400 dark:bg-strongDarkGray" />
            </div>
          </div>
          <div className="w-6 h-6 rounded-md bg-zinc-400 dark:bg-strongDarkGray shrink-0" />
        </div>
      </div>
    </div>
  );
}

const AiChatHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    aiChatId,
    setAiChatId,
    setAiMessages,
    setAiShowSuggestions,
    clearAiChat,
    umamiTrack
  } = useAppContext();
  const getChatHistory = useGetChatHistory();
  const deleteChat = useDeleteChat();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<IAssistantChat | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Page load via React Query (cached / deduped). The per-chat resume fetch
  // below stays imperative — it's a click-driven action, not a page query.
  const { data, isLoading, isError } = useUserChatsQuery();
  const chats: IAssistantChat[] = data?.items ?? [];
  const error = isError ? t('assistant.chatHistoryError') : null;

  // Turns are stateless, so resuming a chat is just loading its history.
  const handleChatClick = async (chat: IAssistantChat) => {
    try {
      const history = await getChatHistory(chat.id);

      const messages: AiMessage[] = history.messages.flatMap((msg, index) => {
        const items: AiMessage[] = [];
        if (msg.text) {
          items.push({ role: msg.role, content: { type: 'message', data: msg.text }, id: `history-${index}` });
        }
        if (msg.displayed_entries?.length) {
          items.push({ role: msg.role, content: { type: 'entries', data: msg.displayed_entries }, id: `history-${index}-entries` });
        }
        return items;
      });

      setAiChatId(chat.id);
      setAiMessages(messages);
      setAiShowSuggestions(false);

      navigate(NAVIGATION_PATHS.aiAssistant);
    } catch (err) {
      console.error('Failed to resume chat:', err);
      toast.error(t('assistant.chatHistoryError'));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteChat(pendingDelete.id);
      umamiTrack('Delete AI Chat');
      // The open assistant must not keep sending into a deleted chat.
      if (aiChatId === pendingDelete.id) clearAiChat();
      await queryClient.invalidateQueries({ queryKey: ['user-chats'] });
      setPendingDelete(null);
    } catch (err) {
      console.error('Failed to delete chat:', err);
      toast.error(t('assistant.deleteChatError'));
    } finally {
      setDeleting(false);
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

  return (
    <div className="flex flex-col h-full w-full overflow-auto">
      <Breadcrumb />
      <div className="flex justify-between items-center pr-4">
        <H1>{t('assistant.chatHistory')}</H1>
        <button
          type="button"
          aria-label={t('assistant.newChat')}
          onClick={handleNewChat}
          className="inline-flex items-center justify-center rounded-full p-2 bg-primary text-onPrimary hover:bg-primaryDark transition-colors shrink-0"
        >
          <FiPlus size={24} />
        </button>
      </div>

      {isLoading ? (
        <div className="max-w-4xl w-full mx-auto px-6 pb-6 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ChatRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="max-w-4xl w-full mx-auto px-6 pb-6">
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
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="cursor-pointer rounded-lg bg-white dark:bg-[#27272a] shadow-[0px_2px_1px_-1px_rgba(0,0,0,0.2),0px_1px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.12)] transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xl font-semibold text-black dark:text-white mb-1">
                          {chat.title || t('assistant.untitledChat')}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <span>{t('assistant.messages', { count: chat.message_count })}</span>
                          <span>•</span>
                          <span>{formatDate(chat.last_message_at ?? chat.created_at)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={t('assistant.deleteChat')}
                        title={t('assistant.deleteChat')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(chat);
                        }}
                        className="ml-4 -mr-1 -mt-1 rounded-md p-2 text-gray-400 dark:text-gray-500 hover:bg-red/10 hover:text-redText dark:hover:text-red transition-colors"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        title={t('assistant.deleteChat')}
        message={t('assistant.deleteChatConfirm', {
          title: pendingDelete?.title || t('assistant.untitledChat'),
        })}
        confirmLabel={t('assistant.deleteChat')}
        cancelLabel={t('assistant.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default AiChatHistory;
