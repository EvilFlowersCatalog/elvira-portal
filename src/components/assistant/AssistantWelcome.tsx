import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiBookmark } from 'react-icons/fi';
import useAssistantCapabilities from '../../hooks/api/assistant/useAssistantCapabilities';
import useAssistantPersonal, { IPersonalBook } from '../../hooks/api/assistant/useAssistantPersonal';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IAssistantEntryRef } from '../../hooks/api/assistant/useAssistantChat';

const card =
  'group flex min-w-0 items-start gap-2.5 rounded-lg border border-zinc-300 bg-white/60 p-2.5 text-left transition-colors hover:border-primary hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:hover:border-primaryLight dark:hover:bg-zinc-800';
const cardIcon =
  'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-primary dark:bg-zinc-700 dark:text-primaryLight';
const sectionLabel = 'text-xs text-gray-500 dark:text-gray-400';

/**
 * An empty chat: what the assistant can do here (`GET …/capabilities`, IP-030), then the publications the reader
 * has on loan or on the shelf (a tap attaches one, and the shortcuts above the input take over). The starter
 * prompts sit above the input (`AssistantChatPanel`), past conversations behind the history button.
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
  const { data } = useAssistantCapabilities({ entryId, bound });
  // A chat about one publication is about that publication: no "pick up elsewhere" offers.
  const personal = useAssistantPersonal(active && !entryId);

  const capabilities = data?.capabilities ?? [];
  const greeting = auth?.name ? t('assistant.welcome.greeting', { name: auth.name }) : t('assistant.welcome.greetingAnonymous');

  const bookNote = (book: IPersonalBook) =>
    book.reason === 'loan' && book.until
      ? t('assistant.welcome.loanUntil', { date: new Date(book.until).toLocaleDateString(lang === 'sk' ? 'sk-SK' : 'en-GB') })
      : t('assistant.welcome.onShelf');

  const showBooks = !entryId && !!onAttach && personal.books.length > 0;

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

      {capabilities.length ? (
        <section
          aria-label={t('assistant.welcome.canDo')}
          className={`w-full flex flex-wrap items-center gap-1.5 ${compact ? '' : 'max-w-2xl justify-center'}`}
        >
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
        </section>
      ) : null}

      {showBooks ? (
        <section aria-label={t('assistant.welcome.askAbout')} className={`w-full grid grid-cols-1 gap-2 sm:grid-cols-2 ${compact ? '' : 'max-w-2xl'}`}>
          {personal.books.map((book) => (
            <button
              key={book.id}
              type="button"
              className={card}
              title={t('assistant.welcome.askAbout')}
              onClick={() => onAttach!({ id: book.id, title: book.title, catalogId: book.catalogId ?? null })}
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
          ))}
        </section>
      ) : null}
    </div>
  );
}
