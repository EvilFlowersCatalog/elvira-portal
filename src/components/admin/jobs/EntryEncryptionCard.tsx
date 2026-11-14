import { useTranslation } from 'react-i18next';
import { FiLock, FiRefreshCw } from 'react-icons/fi';
import { CircleLoader } from 'react-spinners';
import { twMerge } from 'tailwind-merge';
import { useEntryEncryption } from '../../../hooks/api/encryption/useEntryEncryption';
import { encryptionState } from '../../../utils/interfaces/encryption';
import { fmtDateTime } from '../../../utils/func/adminDate';
import EncryptionControls, { EncryptionStatusChip } from './EncryptionControls';
import { jobCard, jobTitle } from './jobsUi';

const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
  <div className="grid grid-cols-[9rem_1fr] gap-3 py-1.5 text-sm">
    <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
    <dd className={twMerge('min-w-0 break-words text-zinc-800 dark:text-zinc-100', mono && 'font-mono text-xs')}>{children}</dd>
  </div>
);

/** One publication's Readium LCP job: state, timestamps, the worker's error and the shortcuts. */
export default function EntryEncryptionCard({ entryId, title, bare }: { entryId: string; title: string; bare?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } = useEntryEncryption(entryId);
  const state = encryptionState(data);
  const job = data?.encryption;

  return (
    <section className={bare ? '' : jobCard}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FiLock className="text-zinc-400" />
        <h2 className={jobTitle}>{t('administration.jobs.lcp.cardTitle')}</h2>
        {state && <EncryptionStatusChip state={state} />}
        {isFetching && !isLoading && <FiRefreshCw className="animate-spin text-zinc-400" size={12} />}
        <EncryptionControls entryId={entryId} title={title} state={state} className="ml-auto" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <CircleLoader size={24} color="#0077cc" />
        </div>
      ) : isError || !state ? (
        <p className="text-sm text-redText dark:text-red">
          {t('administration.jobs.lcp.loadError')}{' '}
          <button type="button" className="font-medium underline" onClick={() => refetch()}>
            {t('administration.table.retry')}
          </button>
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`administration.jobs.lcp.help.${state}`)}</p>
          {job && (
            <dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-700/60">
              <Row label={t('administration.jobs.lcp.contentId')} mono>
                {job.lcp_content_id}
              </Row>
              <Row label={t('administration.jobs.lcp.lendable')}>
                {job.ready_for_licensing ? t('administration.extraction.yes') : t('administration.extraction.no')}
              </Row>
              <Row label={t('administration.jobs.lcp.encryptedAt')}>{fmtDateTime(job.encrypted_at) ?? '—'}</Row>
              <Row label={t('administration.jobs.lcp.registeredAt')}>{fmtDateTime(job.registered_at) ?? '—'}</Row>
            </dl>
          )}
          {job?.error_message && (
            <pre className="mt-3 whitespace-pre-wrap break-words rounded bg-red/10 p-2 text-xs text-redText dark:text-red">
              {job.error_message}
            </pre>
          )}
          {state === 'pending' && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.jobs.lcp.pendingNote')}</p>}
        </>
      )}
    </section>
  );
}
