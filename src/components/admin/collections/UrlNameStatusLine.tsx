import { useTranslation } from 'react-i18next';
import { FiCheck, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { IFeed } from '../../../utils/interfaces/feed';
import { useLocalize } from '../../../utils/func/localized';
import { UrlNameStatus } from '../../../hooks/api/feeds/useFeedUrlNameCheck';

interface UrlNameStatusLineProps {
  id: string;
  status: UrlNameStatus;
  conflict?: IFeed;
  /** A field error is showing (e.g. a server 409) — it replaces the live status. */
  hasError: boolean;
  /** The derived slug was taken and replaced by a numbered variant. */
  autoAdjusted: { from: string; title: string } | null;
  suggestion: string | null;
  onUseSuggestion: (slug: string) => void;
  onOpenConflict?: (feed: IFeed) => void;
}

/** Live availability of a feed URL name plus the one-click fix for a clash. */
export default function UrlNameStatusLine({
  id,
  status,
  conflict,
  hasError,
  autoAdjusted,
  suggestion,
  onUseSuggestion,
  onOpenConflict,
}: UrlNameStatusLineProps) {
  const { t } = useTranslation();
  const tl = useLocalize();
  const live = hasError ? 'idle' : status;

  return (
    <div id={id} aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {live === 'checking' && <span className="text-zinc-400">{t('administration.collectionsPage.urlNameChecking')}</span>}
      {live === 'available' && !autoAdjusted && (
        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
          <FiCheck size={13} aria-hidden="true" />
          {t('administration.collectionsPage.urlNameAvailable')}
        </span>
      )}
      {!hasError && autoAdjusted && status !== 'taken' && (
        <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <FiInfo size={13} aria-hidden="true" />
          {t('administration.collectionsPage.urlNameAutoAdjusted', { slug: autoAdjusted.from, title: autoAdjusted.title })}
        </span>
      )}
      {live === 'taken' && conflict && (
        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
          <FiAlertTriangle size={13} aria-hidden="true" />
          {t('administration.collectionsPage.urlNameTakenBy', { title: tl(conflict.title) })}
          {onOpenConflict && (
            <button
              type="button"
              onClick={() => onOpenConflict(conflict)}
              className="font-medium underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300"
            >
              {t('administration.collectionsPage.urlNameOpenConflict')}
            </button>
          )}
        </span>
      )}
      {suggestion && (
        <button
          type="button"
          onClick={() => onUseSuggestion(suggestion)}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 px-2 py-0.5 font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          {t('administration.collectionsPage.urlNameUseSuggestion')} <code className="font-mono">{suggestion}</code>
        </button>
      )}
    </div>
  );
}
