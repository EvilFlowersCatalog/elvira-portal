import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlay } from 'react-icons/fi';
import { useJobKinds, useJobs } from '../../../hooks/api/jobs/useJobs';
import { ACTIVE_JOB_STATES, IJob, IJobKind } from '../../../utils/interfaces/jobs';
import { fmtDateTime } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import { bulkBtn } from '../BulkBar';
import StatusChip from '../StatusChip';
import JobActionDialog from './JobActionDialog';
import JobDrawer from './JobDrawer';
import { JobStateChip, kindGroup, useKindLabel } from './jobModel';

interface Row {
  kind: IJobKind;
  job: IJob | undefined;
}

/**
 * The catalog's maintenance and sweep tasks (no subject): when each last ran, how it ended, and
 * "Run now" for the ones an operator may need between their scheduled runs.
 */
export default function ScheduledJobs() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: kinds, isLoading: kindsLoading, isError: kindsError } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const scheduled = useMemo(() => (kinds ?? []).filter((k) => kindGroup(k) === 'scheduled'), [kinds]);
  const { data, isLoading, isError, refetch } = useJobs(
    { kind: scheduled.map((k) => k.kind).join(','), limit: 100 },
    { enabled: scheduled.length > 0 }
  );
  const [runKind, setRunKind] = useState<string | null>(null);

  const rows: Row[] = scheduled
    .map((kind) => ({ kind, job: data?.items.find((j) => j.kind === kind.kind) }))
    .sort((a, b) => kindLabel(a.kind.kind).localeCompare(kindLabel(b.kind.kind)));

  const setJob = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('job', id);
    else next.delete('job');
    setSearchParams(next);
  };

  const columns: DataTableColumn<Row>[] = [
    {
      id: 'task',
      header: t('administration.jobs.scheduled.columns.task'),
      hideable: false,
      cell: ({ kind }) => (
        <span className="flex max-w-[min(34rem,50vw)] flex-col">
          <span className="font-medium text-zinc-800 dark:text-zinc-100">{kindLabel(kind.kind)}</span>
          <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400" title={kind.description}>
            {kind.description}
          </span>
        </span>
      ),
    },
    {
      id: 'state',
      header: t('administration.jobs.columns.status'),
      hideable: false,
      cell: ({ job }) => (job ? <JobStateChip job={job} /> : <StatusChip variant="neutral" dot={false}>{t('administration.jobs.scheduled.never')}</StatusChip>),
    },
    {
      id: 'last',
      header: t('administration.jobs.scheduled.columns.last'),
      cell: ({ job }) => <span className="whitespace-nowrap tabular-nums">{fmtDateTime(job?.last_transition_at) ?? '—'}</span>,
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: ({ kind, job }) => (
        <button
          type="button"
          className={bulkBtn}
          disabled={!!job && ACTIVE_JOB_STATES.includes(job.state)}
          onClick={(e) => {
            e.stopPropagation();
            setRunKind(kind.kind);
          }}
        >
          <FiPlay size={12} /> {t('administration.jobs.scheduled.runNow')}
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable<Row>
        caption={t('administration.jobs.scheduled.tableTitle', { count: rows.length })}
        columns={columns}
        rows={rows}
        getRowId={(r) => r.kind.kind}
        onRowClick={(r) => r.job && setJob(r.job.id)}
        loading={kindsLoading || (scheduled.length > 0 && isLoading)}
        error={kindsError || isError ? t('administration.jobs.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={t('administration.jobs.scheduled.empty')}
        storageKey="admin-jobs-scheduled"
      />
      <JobActionDialog
        action={runKind ? { type: 'apply', body: { kind: runKind } } : null}
        title={t('administration.jobs.scheduled.runTitle', { kind: runKind ? kindLabel(runKind) : '' })}
        message={scheduled.find((k) => k.kind === runKind)?.description}
        confirmLabel={t('administration.jobs.scheduled.runNow')}
        onClose={() => setRunKind(null)}
      />
      <JobDrawer jobId={searchParams.get('job')} onClose={() => setJob(null)} />
    </>
  );
}
