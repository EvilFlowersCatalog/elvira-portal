import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiRss } from 'react-icons/fi';
import { CopyButton } from '../CopyId';
import StatusChip from '../StatusChip';
import { useOaiStatus } from '../../../hooks/api/harvest/useHarvest';
import { fmtDateTime } from '../../../utils/func/adminDate';

/**
 * Elvira's own OAI-PMH data provider at a glance (IP-033, #54): the base URL a librarian sends to the STU library or
 * a partner ("where do we harvest you from?"), the record counts and the last change. Hidden when the caller may not
 * read the status (neither superuser nor a catalog manager).
 */
export default function OaiStatusCard() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useOaiStatus();

  if (isError) return null;

  const identifyUrl = data ? `${data.base_url}${data.base_url.includes('?') ? '&' : '?'}verb=Identify` : '';

  return (
    <section
      aria-labelledby="oai-status-title"
      className="mx-5 mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight">
            <FiRss size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="oai-status-title" className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t('administration.oai.title')}
              {data && (
                <StatusChip variant={data.enabled ? 'success' : 'neutral'}>
                  {data.enabled ? t('administration.oai.enabled') : t('administration.oai.disabled')}
                </StatusChip>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.oai.description')}</p>
          </div>
        </div>
        {data && data.enabled && (
          <a
            href={identifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <FiExternalLink size={13} />
            {t('administration.oai.testInBrowser')}
          </a>
        )}
      </div>

      {isLoading || !data ? (
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-700/50" />
      ) : (
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.oai.baseUrl')}</dt>
            <dd className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <code className="truncate rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100" title={data.base_url}>
                {data.base_url}
              </code>
              <CopyButton text={data.base_url} label={t('administration.oai.copyBaseUrl')} />
            </dd>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t('administration.oai.repositoryIdentifier')}: <code>{data.repository_identifier}</code>
            </p>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.oai.records')}</dt>
            <dd className="mt-0.5 font-semibold text-zinc-800 dark:text-zinc-100">
              {t('administration.oai.liveCount', { count: data.live })}
              <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                {t('administration.oai.deletedCount', { count: data.deleted })}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.oai.lastChange')}</dt>
            <dd className="mt-0.5 font-semibold text-zinc-800 dark:text-zinc-100">
              {fmtDateTime(data.last_datestamp) ?? t('administration.oai.never')}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
