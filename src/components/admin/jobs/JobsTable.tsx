import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { FiPlay, FiRefreshCw, FiSquare } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import useTableParams from '../../../hooks/useTableParams';
import useRowSelection from '../../../hooks/useRowSelection';
import useBulkRunner from '../../../hooks/useBulkRunner';
import useEntriesByIds from '../../../hooks/api/entries/useEntriesByIds';
import {
  useInvalidateJobs,
  useJobKinds,
  useJobs,
  useJobsClient,
  useJobSummary,
} from '../../../hooks/api/jobs/useJobs';
import {
  ACTIVE_JOB_STATES,
  IJob,
  JobState,
} from '../../../utils/interfaces/jobs';
import { fmtDateTime } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import BulkBar, { bulkBtn, bulkBtnDanger } from '../BulkBar';
import ConfirmDialog from '../ConfirmDialog';
import Select from '../../primitives/Select';
import JobDrawer from './JobDrawer';
import CopyId from '../CopyId';
import { JobStateChip, kindGroup, useKindLabel } from './jobModel';

const DEFAULT_LIMIT = 25;

/** `?state=` presets over the catalog's job states; `stuck` is the stale filter instead. */
const PRESETS: Record<string, JobState[] | 'stale' | null> = {
  attention: ['failed', 'blocked'],
  active: ['pending', 'queued', 'running', 'cancelling'],
  stuck: 'stale',
  failed: ['failed'],
  succeeded: ['succeeded'],
  all: null,
};
const PRESET_KEYS = Object.keys(PRESETS);

type BulkAction = 'retry' | 'cancel';
const ELIGIBLE: Record<BulkAction, (job: IJob) => boolean> = {
  retry: (j) => j.state === 'failed' || j.state === 'cancelled',
  cancel: (j) => ACTIVE_JOB_STATES.includes(j.state),
};

const chip = (active: boolean) =>
  twMerge(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-primary bg-primary text-white'
      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
  );

/**
 * Every job the catalog tracks (`/api/v1/jobs`), whatever its kind: filter by state and kind,
 * open one for its tasks and history, retry or cancel several at once.
 */
export default function JobsTable({
  fixedKind,
  entryId,
}: { fixedKind?: string; entryId?: string } = {}) {
  const { t } = useTranslation();
  const api = useJobsClient();
  const invalidate = useInvalidateJobs();
  const bulk = useBulkRunner();
  const selection = useRowSelection<IJob>((j) => j.id);
  const [confirm, setConfirm] = useState<BulkAction | null>(null);
  const { searchParams, page, limit, q, orderBy, patch, setQuery, tableProps } =
    useTableParams({
      limit: DEFAULT_LIMIT,
      orderBy: '-last_transition_at',
    });
  const preset = PRESET_KEYS.includes(searchParams.get('state') ?? '')
    ? searchParams.get('state')!
    : // A publication's or a type's jobs: show them all; the unfiltered list opens on what needs a look.
      entryId || fixedKind
      ? 'all'
      : 'attention';
  const kind = fixedKind ?? searchParams.get('kind') ?? '';
  const openJob = searchParams.get('job');

  const { data: kinds } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const scope = useMemo(
    () => ({
      kind: kind || undefined,
      query: q || undefined,
      entry_id: entryId,
    }),
    [kind, q, entryId]
  );
  const presetFilter = PRESETS[preset];
  const query = {
    ...scope,
    state: Array.isArray(presetFilter) ? presetFilter.join(',') : undefined,
    stale: presetFilter === 'stale' ? true : undefined,
    page,
    limit,
    order_by: orderBy,
  };
  const { data, isLoading, isError, error, isFetching, refetch } = useJobs(
    query,
    { poll: !bulk.busy }
  );
  const { data: summary } = useJobSummary(scope);
  const items = useMemo(() => data?.items ?? [], [data]);
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const entryIds = useMemo(
    () =>
      [
        ...new Set(
          items.map((j) => j.entry_id).filter((id): id is string => !!id)
        ),
      ].sort(),
    [items]
  );
  const { data: entries } = useEntriesByIds(entryIds);
  const titleOf = (id: string | null) =>
    id ? entries?.find((e) => e.id === id)?.title : undefined;

  const countOf = (key: string): number | undefined => {
    if (!summary) return undefined;
    const filter = PRESETS[key];
    if (filter === 'stale') return summary.reduce((n, row) => n + row.stale, 0);
    return summary.reduce(
      (n, row) =>
        n +
        Object.entries(row.states).reduce(
          (m, [state, c]) =>
            !filter || filter.includes(state as JobState) ? m + (c ?? 0) : m,
          0
        ),
      0
    );
  };

  const { clear } = selection;
  useEffect(() => clear(), [q, preset, kind, clear]);

  const kindOptions = useMemo(() => {
    const keyed = (kinds ?? []).filter((k) => kindGroup(k) !== 'log');
    const order = (k: (typeof keyed)[number]) =>
      kindGroup(k) === 'publication' ? 0 : 1;
    return [
      { value: '', label: t('administration.jobs.all.allKinds') },
      ...keyed
        .sort(
          (a, b) =>
            order(a) - order(b) ||
            kindLabel(a.kind).localeCompare(kindLabel(b.kind))
        )
        .map((k) => ({
          value: k.kind,
          label:
            kindGroup(k) === 'scheduled'
              ? `${kindLabel(k.kind)} · ${t('administration.jobs.overview.maintenance')}`
              : kindLabel(k.kind),
        })),
    ];
  }, [kinds, kindLabel, t]);

  const actionLabels: Record<BulkAction, string> = {
    retry: t('administration.jobs.actions.retry'),
    cancel: t('administration.jobs.actions.cancel'),
  };
  const eligible = (action: BulkAction) =>
    selection.rows.filter(ELIGIBLE[action]);

  const runBulk = (action: BulkAction) => {
    const rows = new Map(selection.rows.map((j) => [j.id, j]));
    bulk.run({
      action,
      items: selection.rows.map((j) => ({
        id: j.id,
        label: `${kindLabel(j.kind)} — ${titleOf(j.entry_id) ?? j.subject_id ?? ''}`,
      })),
      errorFallback: t('administration.jobs.actions.error'),
      task: async (item, signal) => {
        const job = rows.get(item.id)!;
        if (!ELIGIBLE[action](job)) return 'skipped';
        if (action === 'cancel')
          await api.patch(job.id, { desired_state: 'cancelled' }, signal);
        else
          await api.apply(
            { kind: job.kind, subject_id: job.subject_id, spec: job.spec },
            signal
          );
        return 'done';
      },
      onFinish: () => {
        selection.clear();
        invalidate();
      },
    });
  };

  const columns: DataTableColumn<IJob>[] = [
    {
      id: 'job',
      header: t('administration.jobs.all.columns.job'),
      sortKey: 'kind',
      hideable: false,
      cell: (j) => {
        const title = titleOf(j.entry_id);
        // A job with no publication (maintenance) leads with its kind; the second line would only repeat it.
        if (!entryId && !j.entry_id && !fixedKind) {
          return (
            <span className='flex min-w-0 max-w-[min(26rem,34vw)] flex-col'>
              <span className='truncate font-medium text-zinc-800 dark:text-zinc-100'>
                {kindLabel(j.kind)}
              </span>
              <span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
                {t('administration.jobs.all.noPublication')}
              </span>
            </span>
          );
        }
        return (
          <span className='flex min-w-0 max-w-[min(26rem,34vw)] flex-col'>
            {!entryId && (
              <span
                className='truncate font-medium text-secondary dark:text-secondaryLight'
                title={title}
              >
                {title ??
                  (!j.entry_id ? (
                    t('administration.jobs.all.noPublication')
                  ) : !entries ? (
                    '…'
                  ) : (
                    // The portal lists its own catalog; the job API spans all of them.
                    <span className='inline-flex items-center gap-1.5 font-normal text-zinc-500 dark:text-zinc-400'>
                      {t('administration.jobs.all.otherCatalog')}
                      {j.entry_id && <CopyId value={j.entry_id} short />}
                    </span>
                  ))}
              </span>
            )}
            {/* Inside a type's own list the type is the page's heading, not every row's. */}
            {!fixedKind && (
              <span
                className={twMerge(
                  'truncate',
                  entryId
                    ? 'font-medium text-zinc-800 dark:text-zinc-100'
                    : 'text-xs text-zinc-500 dark:text-zinc-400'
                )}
              >
                {kindLabel(j.kind)}
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: 'state',
      header: t('administration.jobs.columns.status'),
      sortKey: 'state',
      hideable: false,
      cell: (j) => <JobStateChip job={j} />,
    },
    {
      id: 'reason',
      header: t('administration.jobs.all.columns.reason'),
      cell: (j) =>
        j.reason ? (
          <span
            className={twMerge(
              'block max-w-[min(20rem,24vw)] truncate text-xs',
              j.state === 'blocked'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-redText dark:text-red'
            )}
            title={j.reason}
          >
            {j.reason.split('\n')[0]}
          </span>
        ) : (
          <span className='text-zinc-300 dark:text-zinc-600'>—</span>
        ),
    },
    {
      id: 'attempts',
      header: t('administration.jobs.all.columns.attempts'),
      align: 'right',
      defaultHidden: true,
      cell: (j) => j.attempts,
    },
    {
      id: 'updated',
      header: t('administration.jobs.all.columns.updated'),
      sortKey: 'last_transition_at',
      cell: (j) => (
        <span className='whitespace-nowrap tabular-nums'>
          {fmtDateTime(j.last_transition_at ?? j.updated_at)}
        </span>
      ),
    },
    {
      id: 'created',
      header: t('administration.jobs.columns.created'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (j) => fmtDateTime(j.created_at),
    },
  ];

  const forbidden = isAxiosError(error) && error.response?.status === 403;

  return (
    <>
      <DataTable<IJob>
        caption={t('administration.jobs.all.tableTitle', {
          count: metadata.total,
        })}
        columns={columns}
        rows={items}
        getRowId={(j) => j.id}
        onRowClick={(j) => patch({ job: j.id })}
        loading={isLoading}
        error={
          isError
            ? forbidden
              ? t('administration.jobs.all.forbidden')
              : t('administration.jobs.loadError')
            : undefined
        }
        onRetry={() => refetch()}
        emptyTitle={t(
          preset === 'attention'
            ? 'administration.jobs.all.emptyAttention'
            : 'administration.jobs.all.empty'
        )}
        // One publication has a handful of jobs: no pager unless there really is a second page.
        {...(!entryId || metadata.pages > 1
          ? {
              page: metadata.page,
              pageCount: metadata.pages,
              total: metadata.total,
              pageSize: metadata.limit,
            }
          : {})}
        {...tableProps}
        storageKey={entryId ? 'admin-entry-jobs' : 'admin-jobs-all'}
        density={entryId ? 'compact' : undefined}
        className={twMerge(isFetching && !isLoading && 'opacity-90')}
        selection={
          entryId
            ? undefined
            : {
                selected: selection.ids,
                onChange: selection.onChange,
                rowLabel: (j) =>
                  t('administration.bulk.selectRow', {
                    title: `${kindLabel(j.kind)} ${titleOf(j.entry_id) ?? ''}`,
                  }),
                allLabel: t('administration.bulk.selectPage'),
              }
        }
        banner={
          entryId ? undefined : (
            <>
              <div
                role='radiogroup'
                aria-label={t('administration.jobs.all.filter')}
                className='mb-3 flex flex-wrap gap-1.5'
              >
                {PRESET_KEYS.map((key) => {
                  const active = preset === key;
                  const count = countOf(key);
                  const alarming =
                    (key === 'attention' ||
                      key === 'failed' ||
                      key === 'stuck') &&
                    !!count;
                  return (
                    <button
                      key={key}
                      type='button'
                      role='radio'
                      aria-checked={active}
                      className={chip(active)}
                      onClick={() => patch({ state: key, page: null })}
                    >
                      {t(`administration.jobs.all.presets.${key}`)}
                      <span
                        className={twMerge(
                          'rounded-full px-1.5 tabular-nums',
                          active
                            ? 'bg-white/25'
                            : alarming
                              ? 'bg-red/15 text-redText dark:text-red'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
                        )}
                      >
                        {count == null ? '…' : count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
              <BulkBar
                count={selection.size}
                allMatching={false}
                total={metadata.total}
                cap={0}
                canSelectAllMatching={false}
                onSelectAllMatching={() => undefined}
                onClear={selection.clear}
                run={bulk.state}
                actionLabels={actionLabels}
                onCancel={bulk.cancel}
                onDismiss={bulk.reset}
                onSelectFailed={(failed) => {
                  const ids = new Set(failed.map((f) => f.id));
                  selection.replace(items.filter((j) => ids.has(j.id)));
                }}
                actions={
                  <>
                    <button
                      type='button'
                      className={bulkBtn}
                      disabled={bulk.busy || !eligible('retry').length}
                      onClick={() => runBulk('retry')}
                    >
                      <FiPlay size={12} /> {actionLabels.retry}{' '}
                      <span className='tabular-nums text-zinc-400'>
                        ({eligible('retry').length})
                      </span>
                    </button>
                    <button
                      type='button'
                      className={bulkBtnDanger}
                      disabled={bulk.busy || !eligible('cancel').length}
                      onClick={() => setConfirm('cancel')}
                    >
                      <FiSquare size={11} /> {actionLabels.cancel}{' '}
                      <span className='tabular-nums opacity-60'>
                        ({eligible('cancel').length})
                      </span>
                    </button>
                  </>
                }
              />
            </>
          )
        }
        toolbar={
          <div className='flex flex-wrap items-center gap-2'>
            {!entryId && (
              <SearchField
                value={q}
                onChange={setQuery}
                label={t('administration.jobs.search')}
                placeholder={t('administration.jobs.search')}
                className='max-w-sm flex-1'
              />
            )}
            {!fixedKind && !entryId && (
              <Select
                value={kind}
                onChange={(v) => patch({ kind: v || null, page: null })}
                options={kindOptions}
                aria-label={t('administration.jobs.all.kindFilter')}
                className='w-60'
                triggerClassName='py-1.5'
              />
            )}
            <button
              type='button'
              className={twMerge(bulkBtn, 'ml-auto')}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <FiRefreshCw
                size={12}
                className={isFetching ? 'animate-spin' : undefined}
              />{' '}
              {t('administration.jobs.refresh')}
            </button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirm !== null}
        title={t('administration.jobs.all.bulkCancelTitle', {
          count: eligible('cancel').length,
        })}
        message={t('administration.jobs.actions.cancelBody')}
        confirmLabel={actionLabels.cancel}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        onConfirm={() => {
          setConfirm(null);
          runBulk('cancel');
        }}
        onCancel={() => setConfirm(null)}
      />

      <JobDrawer jobId={openJob} onClose={() => patch({ job: null })} />
    </>
  );
}
