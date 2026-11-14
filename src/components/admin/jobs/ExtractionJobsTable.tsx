import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiExternalLink, FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import { useQueueEntryExtraction } from '../../../hooks/api/entries/useEntryExtraction';
import useTableParams from '../../../hooks/useTableParams';
import { IEntry } from '../../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';
import Select from '../../primitives/Select';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import IconButton from '../IconButton';
import ConfirmDialog from '../ConfirmDialog';
import { ExtractionStatusChip } from '../../specific-page/admin-entry-page/extraction/EntryExtractionPanel';

const DEFAULT_LIMIT = 20;

/** `?state=` presets, each a comma-separated `extraction_status` filter. */
const STATE_FILTERS: Record<string, string> = {
  attention: 'queued,running,failed',
  active: 'queued,running',
  failed: 'failed',
  none: 'none',
  done: 'done',
  all: '',
};

const btn =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700';

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

/** AI processing (IP-018) runs per publication, filtered by their state; details live in the entry's AI tab. */
export default function ExtractionJobsTable() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchParams, page, limit, q, orderBy, patch, setQuery, tableProps } = useTableParams({
    limit: DEFAULT_LIMIT,
    orderBy: '-extraction_finished_at',
  });
  const state = searchParams.get('state') && searchParams.get('state')! in STATE_FILTERS ? searchParams.get('state')! : 'attention';

  const { data, isLoading, isError, isFetching, refetch } = useEntriesQuery({
    page,
    limit,
    title: q || undefined,
    orderBy,
    extraction: true,
    extractionStatus: STATE_FILTERS[state] || undefined,
  });
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const openAi = (entry: IEntry) =>
    navigate(NAVIGATION_PATHS.adminEditEntries + entry.id + '?tab=ai', { state: { from: location.search } });

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

  return (
    <DataTable<IEntry>
      caption={t('administration.jobs.ai.tableTitle', { count: metadata.total })}
      columns={columns}
      rows={items}
      getRowId={(e) => e.id}
      onRowClick={openAi}
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
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={q}
            onChange={setQuery}
            label={t('administration.jobs.search')}
            placeholder={t('administration.jobs.search')}
            className="max-w-sm flex-1"
          />
          <Select
            value={state}
            onChange={(v) => patch({ state: v === 'attention' ? null : v, page: null })}
            aria-label={t('administration.jobs.ai.filter')}
            className="w-64"
            options={Object.keys(STATE_FILTERS).map((value) => ({ value, label: t(`administration.jobs.ai.filters.${value}`) }))}
          />
        </div>
      }
    />
  );
}
