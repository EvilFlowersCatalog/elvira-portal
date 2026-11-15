import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiBookOpen, FiBookmark, FiMessageSquare } from 'react-icons/fi';
import useAssistantCapabilities from '../../hooks/api/assistant/useAssistantCapabilities';
import useAssistantPersonal, { IPersonalBook } from '../../hooks/api/assistant/useAssistantPersonal';
import useResumeChat from '../../hooks/api/assistant/useResumeChat';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IAssistantEntryRef } from '../../hooks/api/assistant/useAssistantChat';
import GuideExplore from '../guide/GuideExplore';

const card =
  'group flex min-w-0 items-start gap-2.5 rounded-lg border border-zinc-300 bg-white/60 p-2.5 text-left transition-colors hover:border-primary hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:hover:border-primaryLight dark:hover:bg-zinc-800';
const cardIcon =
  'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-primary dark:bg-zinc-700 dark:text-primaryLight';
const sectionLabel = 'text-xs text-gray-500 dark:text-gray-400';

/**
 * An empty chat. Personal first — the conversation to pick up again and the publications the reader has on loan
 * or on the shelf (a tap attaches one, and the shortcuts above the input take over) — then what to ask here
 * (`GET …/capabilities` starters and capabilities in one block, IP-030), then finding the way around the portal.
 * No model call is involved.
 */
export default function AssistantWelcome({
  entryId,
  bound,
  compact,
  active = true,
  onSend,
  onAttach,
}: {
  entryId?: string;
  bound?: boolean;
  compact?: boolean;
  /** On screen: personal suggestions are fetched only then. */
  active?: boolean;
  onSend: (message: string) => void;
  /** Attaches a publication to the next messages. */
  onAttach?: (entry: IAssistantEntryRef) => void;
}) {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { lang } = useAppContext();
  const { data, isError } = useAssistantCapabilities({ entryId, bound });
  // A chat about one publication is about that publication: no "pick up elsewhere" offers.
  const personal = useAssistantPersonal(active && !entryId);
  const resumeChat = useResumeChat();

  const starters = (data?.starters.length ? data.starters : isError ? [t('assistant.suggestion1'), t('assistant.suggestion2')] : []).slice(0, 3);
  const capabilities = data?.capabilities ?? [];
  const greeting = auth?.name ? t('assistant.welcome.greeting', { name: auth.name }) : t('assistant.welcome.greetingAnonymous');

  const resume = (chatId: string) =>
    resumeChat(chatId).catch(() => {
      toast.error(t('assistant.chatHistoryError'));
    });
  const bookNote = (book: IPersonalBook) =>
    book.reason === 'loan' && book.until
      ? t('assistant.welcome.loanUntil', { date: new Date(book.until).toLocaleDateString(lang === 'sk' ? 'sk-SK' : 'en-GB') })
      : t('assistant.welcome.onShelf');

  const showContinue = !entryId && (personal.lastChat || personal.books.length > 0);

  return (
    <div className={`flex flex-col gap-4 ${compact ? 'py-2' : 'py-6 items-center'}`}>
      {compact ? (
        <p className="text-base font-semibold text-black dark:text-white">{greeting}</p>
      ) : (
        <>
          <h2 className="text-[2.125rem] leading-tight font-bold text-black dark:text-white">{greeting}</h2>
          <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-md">{t('assistant.welcomeMessage')}</p>
        </>
      )}

      {showContinue ? (
        <section aria-label={t('assistant.welcome.continue')} className={`w-full flex flex-col gap-2 ${compact ? '' : 'max-w-2xl'}`}>
          <span className={sectionLabel}>{t('assistant.welcome.continue')}</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {personal.lastChat ? (
              <button type="button" className={card} onClick={() => resume(personal.lastChat!.id)}>
                <span className={cardIcon}>
                  <FiMessageSquare size={15} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-black dark:text-white">{personal.lastChat.title}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t('assistant.welcome.lastChat')}</span>
                </span>
              </button>
            ) : null}
            {onAttach
              ? personal.books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className={card}
                    title={t('assistant.welcome.askAbout')}
                    onClick={() => onAttach({ id: book.id, title: book.title, catalogId: book.catalogId ?? null })}
                  >
                    <span className={cardIcon}>
                      {book.reason === 'loan' ? <FiBookOpen size={15} aria-hidden="true" /> : <FiBookmark size={15} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-black dark:text-white">{book.title}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {bookNote(book)} · {t('assistant.welcome.askAbout')}
                      </span>
                    </span>
                  </button>
                ))
              : null}
          </div>
        </section>
      ) : null}

      {starters.length || capabilities.length ? (
        <section aria-label={t('assistant.welcome.tryAsking')} className={`w-full flex flex-col gap-2 ${compact ? '' : 'max-w-2xl'}`}>
          <span className={sectionLabel}>{t('assistant.welcome.tryAsking')}</span>
          {starters.length ? (
            <div className="flex flex-col gap-1.5">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => onSend(starter)}
                  className="rounded-lg px-3 py-2 text-sm text-left bg-zinc-200 text-gray-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600 transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          ) : null}
          {capabilities.length ? (
            <div className="flex flex-wrap items-center gap-1.5" aria-label={t('assistant.welcome.canDo')}>
              <span className={sectionLabel}>{t('assistant.welcome.canDo')}:</span>
              {capabilities.map((capability) => (
                <button
                  key={capability.id}
                  type="button"
                  onClick={() => onSend(capability.example)}
                  title={capability.example}
                  className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-gray-700 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-gray-200 dark:hover:border-primaryLight dark:hover:text-primaryLight"
                >
                  {capability.label}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Finding the way around is about the portal, not about a book. */}
      {!entryId ? <GuideExplore compact={compact} /> : null}
    </div>
  );
}
