import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../contexts/useAppContext';
import useGuide from '../../contexts/useGuide';
import { matchGuide } from '../../../components/guide/guideRegistry';
import { AiMessage } from '../../../providers/AppProvider';
import { mergeCitations, statusLabelKey } from '../../../utils/func/assistantMessages';
import { IAssistantGuide, IAssistantToolActivity, IChatContext } from '../../../utils/interfaces/assistant';
import { formatRetryAfter, toAssistantError } from './assistantApi';
import useSendChatMessage from './useSendChatMessage';
import useStartChat from './useStartChat';

/** A publication attached to messages ("ask about this book"). */
export interface IAssistantEntryRef {
  id: string;
  title?: string;
  catalogId?: string | null;
  readable?: boolean;
}

/** What goes with one message besides its text. */
export interface ISendOptions {
  /** Attachments, e.g. a figure the reader asks about (`kind: "region"`). */
  contexts?: IChatContext[];
  /** A publication for this message only, instead of the hook's `entry`. */
  entry?: IAssistantEntryRef;
}

/**
 * Drives one assistant conversation against the shared chat state in AppContext:
 * starts the chat on the first message, streams the answer into `aiMessages`
 * and turns API failures into a readable assistant message.
 *
 * @param entry optional publication the reader picked ("ask about this book"). It is
 *   attached to every message sent while it is set — not only when the chat is
 *   created — so picking a book mid-conversation still reaches the assistant.
 */
const useAssistantChat = (entry?: IAssistantEntryRef) => {
  const { t } = useTranslation();
  const { aiChatId, setAiChatId, setAiMessages, aiChatSubject, setAiChatSubject, lang } = useAppContext();
  const startChat = useStartChat();
  const sendChatMessage = useSendChatMessage();
  const { pathname } = useLocation();
  const guide = useGuide();
  const [isGenerating, setGenerating] = useState(false);

  const sendMessage = async (message: string, options: ISendOptions = {}) => {
    const attached = options.entry ?? entry;
    const entryId = attached?.id;
    const contexts = options.contexts?.length ? options.contexts : undefined;
    const stamp = Date.now();
    const answerId = `answer-${stamp}`;

    const updateAnswer = (patch: Partial<AiMessage> | ((m: AiMessage) => Partial<AiMessage>)) =>
      setAiMessages((prev) =>
        prev.map((m) => (m.id === answerId ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
      );
    const retry = { message, entryId, contexts };
    const showError = (text: string, extra: Partial<AiMessage> = {}) =>
      updateAnswer({ text, status: 'error', progress: undefined, ...extra });

    // A "where is …" question gets its way shown at once, while the assistant writes the answer. Attached
    // material (a book, a passage) means the question is about content, not about the portal.
    const local = !entryId && !contexts ? matchGuide(message, guide.access, pathname) : null;
    let offered: IAssistantGuide | undefined = local ? { ...local, source: 'portal' } : undefined;

    setAiMessages((prev) => [
      // Follow-up chips belong to the last answer only.
      ...prev.map((m) => (m.suggestions ? { ...m, suggestions: undefined } : m)),
      {
        id: `user-${stamp}`,
        role: 'user',
        text: message,
        reference: attached && { id: attached.id, title: attached.title },
        contexts,
      },
      { id: answerId, role: 'assistant', text: '', status: 'streaming', guide: offered },
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
      if (entryId && !aiChatSubject) {
        setAiChatSubject({ entryId, title: attached?.title, catalogId: attached?.catalogId, readable: attached?.readable });
      }

      let text = '';
      const annotationIds: string[] = [];
      const activity: IAssistantToolActivity[] = [];
      await sendChatMessage(chatId, message, {
        onChunk: (chunk) => {
          text += chunk;
          updateAnswer({ text, progress: undefined });
        },
        onMessage: (full) => {
          text = full;
          updateAnswer({ text, progress: undefined });
        },
        onStatus: (state, tool) => updateAnswer({ progress: statusLabelKey(state, tool) }),
        onActivity: (call) => {
          const index = activity.findIndex((a) => a.id === call.id);
          if (index >= 0) activity[index] = call;
          else activity.push(call);
          updateAnswer({ activity: [...activity] });
        },
        onEntries: (ids) => {
          if (ids.length) updateAnswer({ entryIds: ids });
        },
        onPages: (pages) => updateAnswer({ pagesRead: pages }),
        // Chips resolve while the answer streams (`citation`); `citations` after it is the authoritative list.
        onCitation: (citation) => updateAnswer((m) => ({ citations: mergeCitations(m.citations, [citation]) })),
        onCitations: (citations) => updateAnswer((m) => ({ citations: mergeCitations(m.citations, citations) })),
        onEvidence: (evidence) => updateAnswer({ evidence }),
        onStudy: (study) => updateAnswer({ study }),
        onSuggestions: (suggestions) => updateAnswer({ suggestions: suggestions.length ? suggestions : undefined }),
        onAnnotation: (annotation) => {
          annotationIds.push(annotation.id);
          updateAnswer({ annotationIds: [...annotationIds] });
        },
        // The assistant's own choice of places replaces the portal's guess.
        onNavigate: (frame) => {
          offered = frame;
          updateAnswer({ guide: frame });
        },
        onError: (detail, failure) =>
          // A failed turn is stored (IP-030 §5): its row is the answer, and the catalog says whether to retry.
          showError(detail || t('assistant.errors.generic'), {
            serverId: failure?.messageId,
            retry: failure?.retryable ? retry : undefined,
          }),
        // `done` names the stored row that closed the turn: the id feedback is posted against.
        onDone: (messageId) => {
          if (messageId) updateAnswer({ serverId: messageId });
        },
      }, { entryId, contexts, language: lang, portalPath: pathname });
      setAiMessages((prev) =>
        prev.map((m) =>
          m.id === answerId && m.status === 'streaming' ? { ...m, status: 'done', progress: undefined } : m,
        ),
      );
      // "Take me there": the assistant may start the guide itself once its answer is complete.
      if (offered?.auto && offered.source === 'assistant') {
        guide.start(offered, { fromChat: true });
      }
    } catch (err) {
      const { status, message: detail, retryAfter } = toAssistantError(err);
      // Nothing reached the catalog's chat, so nothing is stored for this answer.
      const local = { localOnly: true };
      switch (status) {
        case 429: {
          const wait = formatRetryAfter(retryAfter);
          showError(wait ? t('assistant.errors.rateLimited', { retryAfter: wait }) : t('assistant.errors.rateLimitedNoWait'), local);
          break;
        }
        case 403:
          showError(detail || t('assistant.errors.forbidden'), local);
          break;
        case 404:
          // The chat is gone — the next message starts a fresh one.
          setAiChatId(null);
          showError(t('assistant.errors.chatNotFound'), local);
          break;
        case 401:
          showError(t('assistant.errors.unauthorized'), local);
          break;
        default:
          // A dropped connection or a server error: worth trying again.
          showError(t('assistant.errors.generic'), { ...local, retry });
      }
    } finally {
      setGenerating(false);
    }
  };

  /** Sends a failed message again, with what was attached to it. */
  const retryMessage = (failed: AiMessage) => {
    if (!failed.retry) return;
    const { message, entryId, contexts } = failed.retry;
    setAiMessages((prev) => {
      const index = prev.findIndex((m) => m.id === failed.id);
      if (index < 0) return prev;
      // A stored failure stays, as it does when the chat is read back; only its button goes.
      if (!failed.localOnly) return prev.map((m) => (m.id === failed.id ? { ...m, retry: undefined } : m));
      // One the catalog never saw gives way to the new attempt.
      const start = index > 0 && prev[index - 1].role === 'user' ? index - 1 : index;
      return [...prev.slice(0, start), ...prev.slice(index + 1)];
    });
    return sendMessage(message, {
      contexts,
      entry: entryId ? (entryId === entry?.id ? entry : { id: entryId }) : undefined,
    });
  };

  return { sendMessage, retryMessage, isGenerating };
};

export default useAssistantChat;
