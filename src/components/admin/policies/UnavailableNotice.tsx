import { useTranslation } from 'react-i18next';
import { FiInfo } from 'react-icons/fi';

/** The catalog does not have this API yet (#174 / #20 not deployed): one calm notice instead of error toasts. */
export default function UnavailableNotice({ issue, issueUrl }: { issue: string; issueUrl: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-4 flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
      <FiInfo size={18} className="mt-0.5 shrink-0 text-primary dark:text-primaryLight" aria-hidden />
      <p>
        {t('administration.policies.unavailable')}{' '}
        <a href={issueUrl} target="_blank" rel="noreferrer" className="font-medium underline">
          {issue}
        </a>
      </p>
    </div>
  );
}
