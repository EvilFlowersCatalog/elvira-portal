import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { CircleLoader } from 'react-spinners';
import { FiCpu, FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import { useEntryExtraction, useQueueEntryExtraction } from '../../../hooks/api/entries/useEntryExtraction';
import { IAcquisitionExtraction } from '../../../utils/interfaces/extraction';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';
import ConfirmDialog from '../ConfirmDialog';
import CopyId from '../CopyId';
import StatusChip from '../StatusChip';
import {
  ExtractionStatusChip,
  fmtDuration,
  QueueStatus,
} from '../../specific-page/admin-entry-page/extraction/EntryExtractionPanel';
import JobGroups from '../../specific-page/admin-entry-page/extraction/JobGroups';
import { bulkBtn } from '../BulkBar';
import { jobTitle } from './jobsUi';

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
    <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
    <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">{value}</p>
  </div>
);

/** One file's latest run: when it ran, how long, its jobs and the error that stopped it. */
const FileRun = ({ acquisition }: { acquisition: IAcquisitionExtraction }) => {
  const { t } = useTranslation();
  const latest = acquisition.runs[0];
  const busy = acquisition.status === 'queued' || acquisition.status === 'running';
  return (
    <li className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100" title={acquisition.name ?? ''}>
          {acquisition.name ?? acquisition.id}
        </span>
        {acquisition.extractable ? (
          <ExtractionStatusChip status={acquisition.status} />
        ) : (
          <StatusChip variant="neutral">{t(`administration.extraction.reason.${acquisition.reason}`)}</StatusChip>
        )}
        {acquisition.outdated && <StatusChip variant="warning">{t('administration.extraction.outdated')}</StatusChip>}
      </div>
      {latest ? (
        <>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            v{latest.pipeline_version} · {t('administration.extraction.created')}: {fmtDateTime(latest.created_at)}
            {latest.started_at && ` · ${t('administration.extraction.started')}: ${fmtDateTime(latest.started_at)}`}
            {latest.finished_at && ` · ${t('administration.extraction.finished')}: ${fmtDateTime(latest.finished_at)}`}
            {latest.duration != null && ` · ${fmtDuration(latest.duration)}`}
          </p>
          {/* In-progress runs show their jobs in the queue section above. */}
          {!busy && (
            <div className="mt-2">
              <JobGroups run={latest} compact />
            </div>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1">
              {t('administration.jobs.detail.ids.extractionRun')}
              <CopyId value={latest.id} short />
            </span>
            {acquisition.task?.task_id && (
              <span className="inline-flex items-center gap-1">
                {t('administration.jobs.detail.ids.task')}
                <CopyId value={acquisition.task.task_id} short label={t('administration.jobs.detail.copyTaskId')} />
              </span>
            )}
          </p>
          {latest.error && (
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded bg-red/10 p-2 text-[11px] text-redText dark:text-red">
              {latest.error}
            </pre>
          )}
          {acquisition.runs.length > 1 && (
            <p className="mt-1.5 text-[11px] text-zinc-400">{t('administration.jobs.ai.olderRuns', { count: acquisition.runs.length - 1 })}</p>
          )}
        </>
      ) : (
        acquisition.extractable && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.jobs.ai.noRuns')}</p>
      )}
    </li>
  );
};

/**
 * AI processing of one publication for the jobs drawer: status, queue position and live job
 * progress (polled while it runs), each file's latest run with its error, and the shortcuts.
 */
export default function ExtractionJobDetail({ entryId }: { entryId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } = useEntryExtraction(entryId);
  const queue = useQueueEntryExtraction(entryId);
  const [confirm, setConfirm] = useState(false);

  const submit = async (force: boolean) => {
    try {
      await queue.mutateAsync(force ? { force: true } : {});
      toast.success(t('administration.extraction.queued'));
    } catch (error) {
      toast.error(problemDetailMessage(error, t('administration.extraction.queueError')));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <CircleLoader size={28} color="#0077cc" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-redText dark:text-red">
        {t('administration.extraction.loadError')}{' '}
        <button type="button" className="font-medium underline" onClick={() => refetch()}>
          {t('administration.table.retry')}
        </button>
      </p>
    );
  }

  const runs = data.acquisitions.flatMap((a) => a.runs);
  const active = runs.find((r) => r.is_active) ?? null;
  const stats = active?.stats;
  const canQueue = data.enabled && data.status !== 'unsupported' && !queue.isPending;
  const busy = data.status === 'queued' || data.status === 'running';

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <FiCpu className="text-zinc-400" />
          <h2 className={jobTitle}>{t('administration.jobs.ai.cardTitle')}</h2>
          <ExtractionStatusChip status={data.status} />
          {isFetching && <FiRefreshCw className="animate-spin text-zinc-400" size={12} aria-label={t('administration.jobs.refreshing')} />}
          <div className="ml-auto flex gap-1.5">
            {(data.status === 'none' || data.status === 'failed') && (
              <button type="button" className={bulkBtn} disabled={!canQueue} onClick={() => submit(false)}>
                <FiPlay size={12} /> {data.status === 'failed' ? t('administration.extraction.retry') : t('administration.extraction.process')}
              </button>
            )}
            {busy && (
              <button type="button" className={bulkBtn} disabled={!canQueue} title={t('administration.jobs.ai.resendHint')} onClick={() => submit(false)}>
                <FiRefreshCw size={12} /> {t('administration.jobs.ai.resend')}
              </button>
            )}
            {data.status === 'done' && (
              <button type="button" className={bulkBtn} disabled={!canQueue} onClick={() => setConfirm(true)}>
                <FiRotateCw size={12} /> {t('administration.extraction.reprocess')}
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {data.status === 'failed' ? t('administration.jobs.ai.failedHelpDrawer') : t(`administration.extraction.statusHelp.${data.status}`)}
        </p>
        {!data.enabled && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{t('administration.extraction.disabled')}</p>}
        <QueueStatus data={data} />
      </section>

      {stats && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('administration.jobs.ai.activeResult')}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <Fact label={t('administration.extraction.stats.figures')} value={stats.figures} />
            <Fact label={t('administration.extraction.stats.tables')} value={stats.tables} />
            <Fact label={t('administration.extraction.stats.equations')} value={stats.equations} />
            <Fact label={t('administration.extraction.stats.paragraphs')} value={stats.paragraphs.toLocaleString()} />
            <Fact label={t('administration.extraction.stats.pages')} value={active?.page_count ?? '—'} />
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('administration.extraction.filesTitle')}</h3>
        {data.acquisitions.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('administration.extraction.noFiles')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.acquisitions.map((a) => (
              <FileRun key={a.id} acquisition={a} />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title={t('administration.extraction.reprocessConfirmTitle')}
        message={t('administration.extraction.reprocessConfirmBody')}
        confirmLabel={t('administration.extraction.reprocess')}
        cancelLabel={t('administration.usersPage.cancel')}
        onConfirm={() => {
          setConfirm(false);
          submit(true);
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
