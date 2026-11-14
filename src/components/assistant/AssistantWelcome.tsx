import { useTranslation } from 'react-i18next';
import useAssistantCapabilities from '../../hooks/api/assistant/useAssistantCapabilities';
import GuideExplore from '../guide/GuideExplore';

/**
 * An empty chat: what the assistant can do here and 3 starter prompts for this context — a plain chat, a chat
 * about a book, a chat bound to the reader's copy (`GET …/capabilities`, IP-030). No model call is involved; this
 * answers "showcase what you can do" before anyone asks it. Without the endpoint the two classic suggestions remain.
 */
export default function AssistantWelcome({
  entryId,
  bound,
  compact,
  onSend,
}: {
  entryId?: string;
  bound?: boolean;
  compact?: boolean;
  onSend: (message: string) => void;
}) {
  const { t } = useTranslation();
  const { data, isError } = useAssistantCapabilities({ entryId, bound });
  const starters = data?.starters.length
    ? data.starters
    : isError
      ? [t('assistant.suggestion1'), t('assistant.suggestion2')]
      : [];

  return (
    <div className={`flex flex-col gap-3 ${compact ? 'py-2' : 'py-6 items-center'}`}>
      {!compact ? (
        <>
          <h2 className="text-[2.125rem] leading-tight font-bold text-black dark:text-white">{t('assistant.title')}</h2>
          <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-md">{t('assistant.welcomeMessage')}</p>
        </>
      ) : null}
      {data?.capabilities.length ? (
        <section
          aria-label={t('assistant.welcome.canDo')}
          className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white/60 dark:bg-zinc-800/60 p-3 ${compact ? '' : 'max-w-2xl'}`}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {t('assistant.welcome.canDo')}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {data.capabilities.map((capability) => (
              <li key={capability.id}>
                <button
                  type="button"
                  onClick={() => onSend(capability.example)}
                  title={capability.example}
                  className="text-left text-sm text-black dark:text-white hover:text-primary dark:hover:text-primaryLight"
                >
                  • {capability.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {starters.length ? (
        <div className={`w-full flex flex-col gap-1.5 ${compact ? '' : 'max-w-2xl'}`}>
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('assistant.welcome.tryAsking')}</span>
          <div className="flex flex-col sm:flex-row gap-2">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => onSend(starter)}
                className="flex-1 rounded-lg p-2 text-sm text-center bg-zinc-200 text-gray-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600 transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {/* Finding the way around is about the portal, not about a book. */}
      {!entryId ? <GuideExplore compact={compact} /> : null}
    </div>
  );
}
