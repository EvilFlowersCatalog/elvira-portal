import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiExternalLink, FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import { useQueueEntryExtraction } from '../../../hooks/api/entries/useEntryExtraction';
import useJobsApi, { BULK_CAP } from '../../../hooks/api/jobs/useJobsApi';
import useTableParams from '../../../hooks/useTableParams';
import useRowSelection from '../../../hooks/useRowSelection';
import useBulkRunner, { BulkItem } from '../../../hooks/useBulkRunner';
import { IEntry } from '../../../utils/interfaces/entry';
import { ExtractionEntryStatus } from '../../../utils/interfaces/extraction';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import IconButton from '../IconButton';
import ConfirmDialog from '../ConfirmDialog';
import Drawer from '../Drawer';
import BulkBar, { bulkBtn } from '../BulkBar';
import { ExtractionStatusChip } from '../../specific-page/admin-entry-page/extraction/EntryExtractionPanel';
import ExtractionJobDetail from './ExtractionJobDetail';

const DEFAULT_LIMIT = 20;
/** While a row on the page is queued or running, the list refreshes on its own. */
const POLL_MS = 10_000;

/** `?state=` presets, each a comma-separated `extraction_status` filter. */
const STATE_FILTERS: Record<string, string> = {
  attention: 'queued,running,failed',
  active: 'queued,running',
  failed: 'failed',
  none: 'none',
  done: 'done',
  all: '',
};
const FILTER_KEYS = Object.keys(STATE_FILTERS);

type BulkAction = 'process' | 'resend' | 'reprocess';
/** Which statuses each bulk action applies to; the rest are skipped. */
const ELIGIBLE: Record<BulkAction, ExtractionEntryStatus[]> = {
  process: ['none', 'failed'],
  resend: ['queued', 'running'],
  reprocess: ['done'],
};

const btn =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700';

/** Process / retry / re-process one publication through `POST /api/v1/entries/{id}/extraction`. */
const QueueCell = ({ entry }: { entry: IEntry }) => {
  const { t } = useTranslation();
  const queue = useQueueEntryExtraction(entry.id);
  const [confirm, setConfirm] = useState(false);
  const status = entry.extraction_status;

  const submit = async (force: boolean) => {
    try {
      await queue.mutateAsync(force ? { force: true } : {});
      toast.success(t('administration.extraction.queued'));
    } catch (error) {
      toast.error(problemDetailMessage(error, t('administration.extraction.queueError')));
    }
  };

  if (!status || status === 'unsupported') return null;
  const busy = queue.isPending;

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      {status === 'none' && (
        <button type="button" disabled={busy} className={btn} onClick={() => submit(false)}>
          <FiPlay size={12} /> {t('administration.extraction.process')}
        </button>
      )}
      {/* A run left queued/running is sent again without force: the services may have been down. */}
      {(status === 'failed' || status === 'queued' || status === 'running') && (
        <button
          type="button"
          disabled={busy}
          className={btn}
          title={status === 'failed' ? undefined : t('administration.jobs.ai.resendHint')}
          onClick={() => submit(false)}
        >
          <FiRefreshCw size={12} /> {status === 'failed' ? t('administration.extraction.retry') : t('administration.jobs.ai.resend')}
        </button>
      )}
      {status === 'done' && (
        <button type="button" disabled={busy} className={btn} onClick={() => setConfirm(true)}>
          <FiRotateCw size={12} /> {t('administration.extraction.reprocess')}
        </button>
      )}
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
};

/** One preset as a chip with its live count (a `limit=1` read per preset). */
const FilterChip = ({ value, active, q, onSelect }: { value: string; active: boolean; q: string; onSelect: () => void }) => {
  const { t } = useTranslation();
  const { data } = useEntriesQuery({ page: 1, limit: 1, title: q || undefined, extraction: true, extractionStatus: STATE_FILTERS[value] || undefined });
  const count = data?.metadata.total;
  const alarming = (value === 'failed' || value === 'attention') && !!count;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={twMerge(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
      )}
    >
      {t(`administration.jobs.ai.chips.${value}`)}
      <span
        className={twMerge(
          'rounded-full px-1.5 tabular-nums',
          active ? 'bg-white/25' : alarming ? 'bg-red/15 text-redText dark:text-red' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
        )}
      >
        {count == null ? '…' : count.toLocaleString()}
      </span>
    </button>
  );
};

/**
 * AI processing (IP-018) per publication, filtered by state, with bulk process / send again /
 * re-process over the ticked rows or the whole filter. A row opens its run details in a drawer.
 */
export default function ExtractionJobsTable() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useJobsApi();
  const bulk = useBulkRunner();
  const selection = useRowSelection<IEntry>((e) => e.id);
  const [allMatching, setAllMatching] = useState(false);
  const [confirm, setConfirm] = useState<BulkAction | null>(null);
  const [open, setOpen] = useState<IEntry | null>(null);
  const { searchParams, page, limit, q, orderBy, patch, setQuery, tableProps } = useTableParams({
    limit: DEFAULT_LIMIT,
    orderBy: '-extraction_finished_at',
  });
  const state = searchParams.get('state') && searchParams.get('state')! in STATE_FILTERS ? searchParams.get('state')! : 'attention';
  const filterQuery = useMemo(
    () => ({ title: q || undefined, extraction: true, extractionStatus: STATE_FILTERS[state] || undefined }),
    [q, state]
  );

  const { data, isLoading, isError, isFetching, refetch } = useEntriesQuery(
    { page, limit, orderBy, ...filterQuery },
    {
      refetchInterval: (d) =>
        !bulk.busy && d?.items.some((e) => e.extraction_status === 'queued' || e.extraction_status === 'running') ? POLL_MS : false,
    }
  );
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  // A selection belongs to one filter: changing it starts clean.
  const { clear } = selection;
  useEffect(() => {
    clear();
    setAllMatching(false);
  }, [q, state, clear]);

  const openAi = (entry: IEntry) =>
    navigate(NAVIGATION_PATHS.adminEditEntries + entry.id + '?tab=ai', { state: { from: location.search } });

  const isSelectable = (e: IEntry) => !!e.extraction_status && e.extraction_status !== 'unsupported';
  const eligibleCount = (action: BulkAction) =>
    selection.rows.filter((e) => ELIGIBLE[action].includes(e.extraction_status as ExtractionEntryStatus)).length;

  const actionLabels: Record<BulkAction, string> = {
    process: t('administration.jobs.ai.bulk.process'),
    resend: t('administration.jobs.ai.resend'),
    reprocess: t('administration.extraction.reprocess'),
  };

  const runBulk = (action: BulkAction) => {
    const status = new Map<string, ExtractionEntryStatus | undefined>();
    const toItems = (rows: IEntry[]): BulkItem[] =>
      rows.map((e) => {
        status.set(e.id, e.extraction_status as ExtractionEntryStatus | undefined);
        return { id: e.id, label: e.title };
      });
    const picked = selection.rows;
    bulk.run({
      action,
      items: allMatching ? async (signal) => toItems((await api.collectEntries(filterQuery, signal)).items) : toItems(picked),
      errorFallback: t('administration.extraction.queueError'),
      task: async (item, signal) => {
        if (!ELIGIBLE[action].includes(status.get(item.id) as ExtractionEntryStatus)) return 'skipped';
        await api.queueExtraction(item.id, action === 'reprocess', signal);
        return 'done';
      },
      onFinish: () => {
        selection.clear();
        setAllMatching(false);
        api.invalidate();
      },
    });
  };

  const columns: DataTableColumn<IEntry>[] = [
    {
      id: 'title',
      header: t('administration.jobs.columns.publication'),
      sortKey: 'title',
      hideable: false,
      cell: (e) => (
        <span className="block max-w-[min(28rem,40vw)] truncate font-medium text-secondary dark:text-secondaryLight" title={e.title}>
          {e.title}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('administration.jobs.columns.status'),
      sortKey: 'extraction_status',
      hideable: false,
      cell: (e) => (e.extraction_status ? <ExtractionStatusChip status={e.extraction_status} /> : '—'),
    },
    {
      id: 'paragraphs',
      header: t('administration.entriesPage.aiParagraphs'),
      sortKey: 'extraction_paragraphs',
      align: 'right',
      defaultHidden: true,
      cell: (e) => (e.extraction_paragraphs != null ? e.extraction_paragraphs.toLocaleString() : '—'),
    },
    {
      id: 'finished',
      header: t('administration.entriesPage.aiProcessedAt'),
      sortKey: 'extraction_finished_at',
      cell: (e) => fmtDateTime(e.extraction_finished_at) ?? '—',
    },
    {
      id: 'created_at',
      header: t('administration.jobs.columns.created'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (e) => fmtDateTime(e.created_at) ?? '—',
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1">
          <QueueCell entry={e} />
          <IconButton
            label={t('administration.entriesPage.aiOpen')}
            variant="ghost"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              openAi(e);
            }}
          >
            <FiExternalLink size={14} />
          </IconButton>
        </div>
      ),
    },
  ];

  const selectableOnPage = items.filter(isSelectable);
  const pageAllTicked = selectableOnPage.length > 0 && selectableOnPage.every((e) => selection.ids.has(e.id));

  const bulkButton = (action: BulkAction, icon: React.ReactNode) => {
    const n = allMatching ? null : eligibleCount(action);
    return (
      <button
        type="button"
        className={bulkBtn}
        disabled={bulk.busy || n === 0}
        title={action === 'resend' ? t('administration.jobs.ai.resendHint') : undefined}
        onClick={() => (action === 'reprocess' || allMatching ? setConfirm(action) : runBulk(action))}
      >
        {icon} {actionLabels[action]}
        {n != null && <span className="tabular-nums text-zinc-400">({n})</span>}
      </button>
    );
  };

  const confirmTarget = allMatching ? Math.min(metadata.total, BULK_CAP) : confirm ? eligibleCount(confirm) : 0;

  return (
    <>
      <DataTable<IEntry>
        caption={t('administration.jobs.ai.tableTitle', { count: metadata.total })}
        columns={columns}
        rows={items}
        getRowId={(e) => e.id}
        onRowClick={setOpen}
        loading={isLoading}
        error={isError ? t('administration.jobs.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={t(state === 'attention' ? 'administration.jobs.ai.emptyAttention' : 'administration.jobs.ai.empty')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey="admin-jobs-ai"
        className={twMerge(isFetching && !isLoading && 'opacity-90')}
        selection={{
          selected: selection.ids,
          onChange: (rows, checked) => {
            setAllMatching(false);
            selection.onChange(rows, checked);
          },
          isSelectable,
          rowLabel: (e) => t('administration.bulk.selectRow', { title: e.title }),
          allLabel: t('administration.bulk.selectPage'),
        }}
        banner={
          <>
          <div role="radiogroup" aria-label={t('administration.jobs.ai.filter')} className="mb-3 flex flex-wrap gap-1.5">
            {FILTER_KEYS.map((value) => (
              <FilterChip
                key={value}
                value={value}
                q={q}
                active={state === value}
                onSelect={() => patch({ state: value === 'attention' ? null : value, page: null })}
              />
            ))}
          </div>
          <BulkBar
            count={selection.size}
            allMatching={allMatching}
            total={metadata.total}
            cap={BULK_CAP}
            canSelectAllMatching={pageAllTicked && metadata.pages > 1}
            onSelectAllMatching={() => setAllMatching(true)}
            onClear={() => {
              selection.clear();
              setAllMatching(false);
            }}
            run={bulk.state}
            actionLabels={actionLabels}
            onCancel={bulk.cancel}
            onDismiss={bulk.reset}
            onSelectFailed={(failed) => {
              const ids = new Set(failed.map((f) => f.id));
              // Only rows of this page can be re-ticked with their data; others are listed in the summary.
              selection.replace(items.filter((e) => ids.has(e.id)));
            }}
            actions={
              <>
                {bulkButton('process', <FiPlay size={12} />)}
                {bulkButton('resend', <FiRefreshCw size={12} />)}
                {bulkButton('reprocess', <FiRotateCw size={12} />)}
              </>
            }
          />
          </>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={q}
              onChange={setQuery}
              label={t('administration.jobs.search')}
              placeholder={t('administration.jobs.search')}
              className="max-w-sm flex-1"
            />
            <button type="button" className={bulkBtn} onClick={() => refetch()} disabled={isFetching}>
              <FiRefreshCw size={12} className={isFetching ? 'animate-spin' : undefined} /> {t('administration.jobs.refresh')}
            </button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirm !== null}
        title={t('administration.jobs.ai.bulk.confirmTitle', { action: confirm ? actionLabels[confirm] : '' })}
        message={[
          allMatching
            ? t('administration.jobs.ai.bulk.confirmAll', { count: confirmTarget, filter: t(`administration.jobs.ai.chips.${state}`) })
            : t('administration.jobs.ai.bulk.confirmSelected', { count: confirmTarget }),
          confirm === 'reprocess' && t('administration.jobs.ai.bulk.reprocessWarning'),
          allMatching && t('administration.jobs.ai.bulk.skipNote'),
        ]
          .filter(Boolean)
          .join(' ')}
        confirmLabel={confirm ? actionLabels[confirm] : ''}
        cancelLabel={t('administration.usersPage.cancel')}
        onConfirm={() => {
          const action = confirm!;
          setConfirm(null);
          runBulk(action);
        }}
        onCancel={() => setConfirm(null)}
      />

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        description={t('administration.jobs.ai.drawerDescription')}
        width="max-w-xl"
        footer={
          open && (
            <button
              type="button"
              onClick={() => openAi(open)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight"
            >
              {t('administration.jobs.ai.openTab')} <FiExternalLink size={13} />
            </button>
          )
        }
      >
        {open && <ExtractionJobDetail entryId={open.id} />}
      </Drawer>
    </>
  );
}
