import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiInfo } from 'react-icons/fi';

export const jobCard = 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm';
export const jobTitle = 'text-sm font-semibold text-zinc-700 dark:text-zinc-200';

/** OCR is not functional on the backend (no worker, no API) — tracked here. */
export const OCR_ISSUE_URL = 'https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/146';

/** Quiet explanation strip above a jobs view. */
export const JobsNote = ({ children, link }: { children: React.ReactNode; link?: { href: string; label: string } }) => (
  <div className="mx-5 mb-3 flex gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
    <FiInfo className="mt-0.5 shrink-0 text-zinc-400" size={14} />
    <p>
      {children}
      {link && (
        <>
          {' '}
          <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primaryText hover:underline dark:text-primaryLight">
            {link.label} <FiExternalLink size={11} />
          </a>
        </>
      )}
    </p>
  </div>
);

/** OCR has nothing to show or dispatch until the backend gives it a job model and an API. */
export const OcrUnavailable = ({ compact }: { compact?: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className={compact ? '' : 'mx-5'}>
      <div className={jobCard}>
        <h2 className={jobTitle}>{t('administration.jobs.ocr.title')}</h2>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{t('administration.jobs.ocr.body')}</p>
        {!compact && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>{t('administration.jobs.ocr.reasonWorker')}</li>
            <li>{t('administration.jobs.ocr.reasonFlags')}</li>
            <li>{t('administration.jobs.ocr.reasonApi')}</li>
          </ul>
        )}
        <a
          href={OCR_ISSUE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight"
        >
          {t('administration.jobs.ocr.issue')} <FiExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
