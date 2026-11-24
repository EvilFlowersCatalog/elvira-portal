import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { FaX } from 'react-icons/fa6';
import { FiBookOpen, FiTrash2 } from 'react-icons/fi';
import { IAssistantChat } from '../../utils/interfaces/assistant';
import { fmtDate } from '../../utils/func/adminDate';
import useUserChatsQuery from '../../hooks/api/assistant/useUserChatsQuery';
import useResumeChat from '../../hooks/api/assistant/useResumeChat';
import useDeleteChat from '../../hooks/api/assistant/useDeleteChat';
import useAppContext from '../../hooks/contexts/useAppContext';
import useEscapeLayer from '../../hooks/useEscapeLayer';

/**
 * Past conversations as a list over the whole assistant drawer. A row opens that conversation in the drawer;
 * deleting asks in the row itself.
 */
export default function AssistantHistory({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { aiChatId, clearAiChat, umamiTrack } = useAppContext();
  const resumeChat = useResumeChat();
  const deleteChat = useDeleteChat();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useUserChatsQuery({}, { enabled: open });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEscapeLayer(onClose, open);
  if (!open) return null;

  const chats: IAssistantChat[] = data?.items ?? [];

  const openChat = async (chat: IAssistantChat) => {
    try {
      await resumeChat(chat.id);
      onClose();
    } catch {
      toast.error(t('assistant.chatHistoryError'));
    }
  };

  const remove = async (chat: IAssistantChat) => {
    setDeleting(true);
    try {
      await deleteChat(chat.id);
      umamiTrack('Delete AI Chat');
      // The open assistant must not keep sending into a deleted chat.
      if (aiChatId === chat.id) clearAiChat();
      await queryClient.invalidateQueries({ queryKey: ['user-chats'] });
      setConfirming(null);
    } catch {
      toast.error(t('assistant.deleteChatError'));
    } finally {
      setDeleting(false);
    }
  };

  const when = (value: string) => {
    const days = Math.floor(Math.abs(Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return t('assistant.today');
    if (days === 1) return t('assistant.yesterday');
    if (days < 7) return t('assistant.daysAgo', { count: days });
    return fmtDate(new Date(value).toISOString());
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col p-3 bg-[#F4F6F9] dark:bg-[#27272A]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xl font-semibold text-black dark:text-white">{t('assistant.chatHistory')}</p>
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <FaX size={14} className="text-black dark:text-white" />
        </button>
      </div>

      <div className="grow overflow-y-auto">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">…</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-red-500">{t('assistant.chatHistoryError')}</p>
        ) : chats.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{t('assistant.noChats')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-300 dark:divide-zinc-700">
            {chats.map((chat) => (
              <li key={chat.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openChat(chat)}
                  className="min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <span className="block truncate text-sm font-medium text-black dark:text-white">
                    {chat.title || t('assistant.untitledChat')}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="shrink-0">{when(chat.last_message_at ?? chat.created_at)}</span>
                    <span className="shrink-0">· {t('assistant.messages', { count: chat.message_count })}</span>
                    {chat.entry ? (
                      <>
                        <FiBookOpen size={12} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{chat.entry.title}</span>
                      </>
                    ) : null}
                  </span>
                </button>
                {confirming === chat.id ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => remove(chat)}
                      className="rounded-md px-2 py-1 font-medium text-white bg-redText hover:bg-red disabled:opacity-50"
                    >
                      {t('assistant.deleteChat')}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirming(null)}
                      className="rounded-md px-2 py-1 text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      {t('assistant.cancel')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={t('assistant.deleteChat')}
                    title={t('assistant.deleteChat')}
                    onClick={() => setConfirming(chat.id)}
                    className="shrink-0 rounded-md p-2 text-gray-400 hover:text-redText dark:text-gray-500 dark:hover:text-red transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
