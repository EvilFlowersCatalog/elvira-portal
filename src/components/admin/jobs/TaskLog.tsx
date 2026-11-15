import { useTranslation } from 'react-i18next';
import { FiRefreshCw } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import useTableParams from '../../../hooks/useTableParams';
import { useJobKinds, useJobRuns } from '../../../hooks/api/jobs/useJobs';
import { ACTIVE_RUN_STATUSES, IJobRun } from '../../../utils/interfaces/jobs';
import { fmtDateTime } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import { bulkBtn } from '../BulkBar';
import CopyId, { CopyButton } from '../CopyId';
import JobDrawer from './JobDrawer';
import { fmtRuntime, RunStatusChip, useRunLabel } from './jobModel';

const PRESETS: Record<string, string | undefined> = {
  all: undefined,
  active: ACTIVE_RUN_STATUSES.join(','),
  failed: 'failed,lost,rejected',
};
const PRESET_KEYS = Object.keys(PRESETS);

const chip = (active: boolean) =>
  twMerge(
    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-primary bg-primary text-white'
      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
  );

/**
 * Every Celery task execution the catalog recorded, newest first — jobs' tasks, their follow-ups,
 * e-mails and embedding batches. For debugging: task ids, workers, runtimes and errors in one list.
 */
export default function TaskLog({ kind }: { kind?: string } = {}) {
  const { t } = useTranslation();
  const { data: kinds } = useJobKinds();
  const runLabel = useRunLabel(kinds);
  const { searchParams, page, limit, q, orderBy, patch, setQuery, tableProps } = useTableParams({ limit: 50, orderBy: '-created_at' });
  const preset = PRESET_KEYS.includes(searchParams.get('status') ?? '') ? searchParams.get('status')! : 'all';
  const { data, isLoading, isError, isFetching, refetch } = useJobRuns(
    { kind, status: PRESETS[preset], name: q || undefined, page, limit, order_by: orderBy },
    { poll: true }
  );
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const columns: DataTableColumn<IJobRun>[] = [
    {
      id: 'task',
      header: t('administration.jobs.log.columns.task'),
      sortKey: 'name',
      hideable: false,
      cell: (r) => (
        <span className="flex min-w-0 max-w-[min(20rem,24vw)] flex-col">
          <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">{runLabel(r)}</span>
          <code className="truncate font-mono text-[11px] text-zinc-400" title={r.name}>
            {r.name}
          </code>
        </span>
      ),
    },
    { id: 'status', header: t('administration.jobs.columns.status'), sortKey: 'status', hideable: false, cell: (r) => <RunStatusChip status={r.status} /> },
    {
      id: 'error',
      header: t('administration.jobs.columns.error'),
      cell: (r) =>
        r.error ? (
          <span className="flex max-w-[min(18rem,20vw)] items-center gap-1">
            <span className="truncate text-xs text-redText dark:text-red" title={r.error}>
              {r.error.split('\n')[0]}
            </span>
            <CopyButton text={r.error} label={t('administration.jobs.detail.copyError')} />
          </span>
        ) : (
          <span className="text-zinc-300 dark:text-zinc-600">—</span>
        ),
    },
    { id: 'id', header: t('administration.jobs.log.columns.taskId'), cell: (r) => <CopyId value={r.id} short label={t('administration.jobs.detail.copyTaskId')} /> },
    {
      id: 'worker',
      header: t('administration.jobs.log.columns.worker'),
      defaultHidden: true,
      cell: (r) => <span className="block max-w-[14rem] truncate text-xs" title={r.worker ?? ''}>{r.worker ?? '—'}</span>,
    },
    { id: 'queue', header: t('administration.jobs.log.columns.queue'), defaultHidden: true, cell: (r) => r.queue ?? '—' },
    { id: 'runtime', header: t('administration.jobs.log.columns.runtime'), align: 'right', cell: (r) => <span className="tabular-nums">{fmtRuntime(r.runtime) ?? '—'}</span> },
    {
      id: 'created',
      header: t('administration.jobs.log.columns.created'),
      sortKey: 'created_at',
      cell: (r) => <span className="whitespace-nowrap tabular-nums">{fmtDateTime(r.started_at ?? r.created_at)}</span>,
    },
  ];

  return (
    <>
      <DataTable<IJobRun>
        caption={t('administration.jobs.log.tableTitle', { count: metadata.total })}
        columns={columns}
        rows={items}
        getRowId={(r) => r.id}
        onRowClick={(r) => r.job_id && patch({ job: r.job_id })}
        loading={isLoading}
        error={isError ? t('administration.jobs.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={t('administration.jobs.log.empty')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        pageSizeOptions={[25, 50, 100]}
        {...tableProps}
        storageKey="admin-jobs-log"
        density="compact"
        className={twMerge(isFetching && !isLoading && 'opacity-90')}
        banner={
          <div role="radiogroup" aria-label={t('administration.jobs.log.filter')} className="mb-3 flex flex-wrap gap-1.5">
            {PRESET_KEYS.map((key) => (
              <button key={key} type="button" role="radio" aria-checked={preset === key} className={chip(preset === key)} onClick={() => patch({ status: key === 'all' ? null : key, page: null })}>
                {t(`administration.jobs.log.presets.${key}`)}
              </button>
            ))}
          </div>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchField value={q} onChange={setQuery} label={t('administration.jobs.log.search')} placeholder={t('administration.jobs.log.search')} className="max-w-sm flex-1" />
            <button type="button" className={twMerge(bulkBtn, 'ml-auto')} onClick={() => refetch()} disabled={isFetching}>
              <FiRefreshCw size={12} className={isFetching ? 'animate-spin' : undefined} /> {t('administration.jobs.refresh')}
            </button>
          </div>
        }
      />
      <JobDrawer jobId={searchParams.get('job')} onClose={() => patch({ job: null })} />
    </>
  );
}
