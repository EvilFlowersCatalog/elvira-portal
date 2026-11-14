import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPaperPlane, FaX } from 'react-icons/fa6';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAssistantChat, { IAssistantEntryRef, ISendOptions } from '../../hooks/api/assistant/useAssistantChat';
import useStickToBottom from '../../hooks/useStickToBottom';
import AssistantMessage from './AssistantMessage';
import AssistantWelcome from './AssistantWelcome';
import BookPicker from './BookPicker';

type Mode = 'ask' | 'learn' | 'quiz';
const MODES: Mode[] = ['ask', 'learn', 'quiz'];

/**
 * The assistant conversation — messages, the empty-chat welcome and the composer — shared by the AI page and
 * the drawer, which add only their own chrome (#16: the streaming logic and message rendering used to be
 * duplicated between them).
 *
 * The composer's mode switch (Ask / Learn / Quiz) only prefixes the request; the catalog picks the study tool
 * from it (IP-030 Phase 4). The book picker attaches a publication to the next messages.
 */
export default function AssistantChatPanel({
  entry,
  onClearEntry,
  compact,
  onNavigate,
}: {
  /** A publication attached from outside, e.g. "ask about this book" on its detail. */
  entry?: IAssistantEntryRef;
  onClearEntry?: () => void;
  compact?: boolean;
  /** Called before the viewer opens. */
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { aiMessages, aiChatSubject, setAiShowSuggestions } = useAppContext();
  const [picked, setPicked] = useState<IAssistantEntryRef | null>(null);
  const attached = picked ?? entry;
  const { sendMessage, retryMessage, isGenerating } = useAssistantChat(attached);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('ask');

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const follow = useStickToBottom(scrollRef, contentRef);

  const send = (message: string, options?: ISendOptions) => {
    setAiShowSuggestions(false);
    follow();
    sendMessage(message, options);
  };

  const request = (text: string): string => {
    if (mode === 'ask') return text;
    const prefix = t(mode === 'learn' ? 'assistant.mode.learnPrefix' : 'assistant.mode.quizPrefix');
    // Without a topic of its own the request is about the chat's publication.
    return text ? `${prefix}: ${text}` : `${prefix}.`;
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (isGenerating || (!text && mode === 'ask')) return;
    send(request(text));
    setInput('');
  };

  const clearAttached = () => {
    if (picked) setPicked(null);
    else onClearEntry?.();
  };

  const busy = isGenerating;
  const followUp = busy ? undefined : send;
  const subjectId = aiChatSubject?.entryId ?? attached?.id;

  return (
    <>
      <div ref={scrollRef} className={`flex flex-col grow overflow-y-auto ${compact ? '' : 'w-full max-w-5xl px-4 py-4'}`}>
        <div ref={contentRef} className="flex flex-col">
          {aiMessages.length === 0 ? (
            <AssistantWelcome
              entryId={subjectId}
              bound={!!aiChatSubject?.userAcquisitionId}
              compact={compact}
              onSend={(message) => send(message)}
            />
          ) : (
            aiMessages.map((msg) => (
              <AssistantMessage
                key={msg.id}
                msg={msg}
                messages={aiMessages}
                compact={compact}
                onNavigate={onNavigate}
                onSend={followUp}
                onRetry={busy ? undefined : retryMessage}
              />
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={compact ? '' : 'w-full max-w-5xl px-4 pb-4'}>
        {attached ? (
          <div className="mb-1 flex w-full items-center gap-2 text-xs text-black dark:text-zinc-200">
            <p className="truncate">{t('assistant.entryAssistant', { x: attached.title ?? '' })}</p>
            <button
              type="button"
              aria-label={t('assistant.picker.remove')}
              onClick={clearAttached}
              className="ml-auto p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <FaX size={11} />
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-1 mb-1.5" role="radiogroup" aria-label={t('assistant.mode.label')}>
          {MODES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${
                mode === value
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {t(`assistant.mode.${value}`)}
            </button>
          ))}
        </div>
        <div
          className={`flex items-center gap-2 ${
            compact
              ? 'rounded-lg px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#3f3f46] dark:hover:bg-[#4b5563]'
              : 'rounded-xl px-4 py-2.5 bg-white hover:bg-zinc-100 drop-shadow-lg dark:bg-[#3f3f46] dark:hover:bg-[#4b5563]'
          }`}
        >
          {/* A chat about a publication already has one; the picker is for a plain chat. */}
          {!aiChatSubject ? <BookPicker onPick={setPicked} disabled={busy} /> : null}
          <input
            type="text"
            disabled={busy}
            placeholder={t('assistant.inputPlaceholder')}
            aria-label={t('assistant.inputPlaceholder')}
            className={`flex-1 bg-transparent outline-none text-black dark:text-[#e5e7eb] disabled:opacity-60 ${compact ? 'text-sm' : ''}`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            type="submit"
            aria-label={t('common.send')}
            disabled={busy || (!input.trim() && mode === 'ask')}
            className="inline-flex items-center justify-center p-1 disabled:opacity-40"
          >
            <FaPaperPlane size={compact ? 14 : 16} className="dark:text-white" />
          </button>
        </div>
      </form>
    </>
  );
}
