import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../contexts/useAppContext';
import { AiMessage } from '../../../providers/AppProvider';
import { formatRetryAfter, toAssistantError } from './assistantApi';
import useSendChatMessage from './useSendChatMessage';
import useStartChat from './useStartChat';

/**
 * Drives one assistant conversation against the shared chat state in AppContext:
 * starts the chat on the first message, streams the answer into `aiMessages`
 * and turns API failures into a readable assistant message.
 *
 * @param entry optional publication the reader picked ("ask about this book"). It is
 *   attached to every message sent while it is set — not only when the chat is
 *   created — so picking a book mid-conversation still reaches the assistant.
 */
const useAssistantChat = (
  entry?: { id: string; title?: string; catalogId?: string | null; readable?: boolean },
) => {
  const entryId = entry?.id;
  const { t } = useTranslation();
  const { aiChatId, setAiChatId, setAiMessages, aiChatSubject, setAiChatSubject, lang } = useAppContext();
  const startChat = useStartChat();
  const sendChatMessage = useSendChatMessage();
  const [isGenerating, setGenerating] = useState(false);

  const sendMessage = async (message: string) => {
    const stamp = Date.now();
    const answerId = `answer-${stamp}`;

    const updateAnswer = (patch: Partial<AiMessage>) =>
      setAiMessages((prev) => prev.map((m) => (m.id === answerId ? { ...m, ...patch } : m)));
    const showError = (text: string) => updateAnswer({ text, status: 'error' });

    setAiMessages((prev) => [
      ...prev,
      { id: `user-${stamp}`, role: 'user', text: message, reference: entry && { id: entry.id, title: entry.title } },
      { id: answerId, role: 'assistant', text: '', status: 'streaming' },
    ]);
    setGenerating(true);

    try {
      let chatId = aiChatId;
      if (!chatId) {
        const chat = await startChat({
          catalog_id: import.meta.env.ELVIRA_CATALOG_ID || undefined,
          entry_id: entryId,
        });
        chatId = chat.id;
        setAiChatId(chatId);
      }
      // A chat started from a book is about that book: its page citations open it.
      if (entryId && !aiChatSubject) setAiChatSubject({ entryId, title: entry?.title, catalogId: entry?.catalogId, readable: entry?.readable });

      let text = '';
      await sendChatMessage(chatId, message, {
        onChunk: (chunk) => {
          text += chunk;
          updateAnswer({ text });
        },
        onMessage: (full) => {
          text = full;
          updateAnswer({ text });
        },
        onEntries: (ids) => {
          if (ids.length) updateAnswer({ entryIds: ids });
        },
        onPages: (pages) => updateAnswer({ pagesRead: pages }),
        onError: (detail) => showError(detail || t('assistant.errors.generic')),
        onDone: () => {},
      }, { entryId, language: lang });
      setAiMessages((prev) =>
        prev.map((m) => (m.id === answerId && m.status === 'streaming' ? { ...m, status: 'done' } : m)),
      );
    } catch (err) {
      const { status, message: detail, retryAfter } = toAssistantError(err);
      switch (status) {
        case 429: {
          const wait = formatRetryAfter(retryAfter);
          showError(wait ? t('assistant.errors.rateLimited', { retryAfter: wait }) : t('assistant.errors.rateLimitedNoWait'));
          break;
        }
        case 403:
          showError(detail || t('assistant.errors.forbidden'));
          break;
        case 404:
          // The chat is gone — the next message starts a fresh one.
          setAiChatId(null);
          showError(t('assistant.errors.chatNotFound'));
          break;
        case 401:
          showError(t('assistant.errors.unauthorized'));
          break;
        default:
          showError(t('assistant.errors.generic'));
      }
    } finally {
      setGenerating(false);
    }
  };

  return { sendMessage, isGenerating };
};

export default useAssistantChat;
