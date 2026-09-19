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
 * @param entryId optional publication the chat is about (only used when the chat is created).
 */
const useAssistantChat = (entryId?: string) => {
  const { t } = useTranslation();
  const { aiChatId, setAiChatId, setAiMessages } = useAppContext();
  const startChat = useStartChat();
  const sendChatMessage = useSendChatMessage();
  const [isGenerating, setGenerating] = useState(false);

  const sendMessage = async (message: string) => {
    const stamp = Date.now();
    const loadingId = `loading-${stamp}`;
    const answerId = `answer-${stamp}`;

    const withoutLoading = (messages: AiMessage[]) => messages.filter((m) => m.id !== loadingId);

    // Shows `text` as the answer, creating the message on first use.
    const setAnswer = (text: string) =>
      setAiMessages((prev) => {
        const rest = withoutLoading(prev);
        const answer: AiMessage = { role: 'assistant', content: { type: 'message', data: text }, id: answerId };
        return rest.some((m) => m.id === answerId)
          ? rest.map((m) => (m.id === answerId ? answer : m))
          : [...rest, answer];
      });

    const showError = (text: string) =>
      setAiMessages((prev) => [
        ...withoutLoading(prev),
        { role: 'assistant', content: { type: 'message', data: text }, id: `error-${stamp}` },
      ]);

    setAiMessages((prev) => [
      ...prev,
      { role: 'user', content: { type: 'message', data: message } },
      { role: 'assistant', content: { type: 'loading', data: 'Generating response...' }, id: loadingId },
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

      let text = '';
      await sendChatMessage(chatId, message, {
        onChunk: (chunk) => {
          text += chunk;
          setAnswer(text);
        },
        onMessage: (full) => {
          text = full;
          setAnswer(full);
        },
        onEntries: (ids) => {
          if (ids.length === 0) return;
          setAiMessages((prev) => [
            ...withoutLoading(prev),
            { role: 'assistant', content: { type: 'entries', data: ids }, id: `entries-${Date.now()}` },
          ]);
        },
        onError: (detail) => {
          showError(detail || t('assistant.errors.generic'));
        },
        onDone: () => {},
      });
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
      // Drops a leftover spinner if the stream ended without any answer.
      setAiMessages((prev) => (prev.some((m) => m.id === loadingId) ? withoutLoading(prev) : prev));
      setGenerating(false);
    }
  };

  return { sendMessage, isGenerating };
};

export default useAssistantChat;
