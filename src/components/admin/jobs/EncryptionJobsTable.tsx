import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiExternalLink, FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import { useEntryEncryption } from '../../../hooks/api/encryption/useEntryEncryption';
import useAxios from '../../../hooks/api/useAxios';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import useJobsApi, { BULK_CAP } from '../../../hooks/api/jobs/useJobsApi';
import useTableParams from '../../../hooks/useTableParams';
import useRowSelection from '../../../hooks/useRowSelection';
import useBulkRunner, { BulkItem } from '../../../hooks/useBulkRunner';
import { IEntry } from '../../../utils/interfaces/entry';
import { EncryptionState, encryptionState, IEntryEncryption } from '../../../utils/interfaces/encryption';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import Drawer from '../Drawer';
import IconButton from '../IconButton';
import ConfirmDialog from '../ConfirmDialog';
import BulkBar, { bulkBtn, bulkBtnDanger } from '../BulkBar';
import EncryptionControls, { EncryptionStatusChip } from './EncryptionControls';
import EntryEncryptionCard from './EntryEncryptionCard';

const DEFAULT_LIMIT = 20;

type BulkAction = 'start' | 'recreate';
/** Which job states each bulk action applies to; the rest are skipped. */
const ELIGIBLE: Record<BulkAction, EncryptionState[]> = {
  start: ['not_started', 'failed'],
  recreate: ['pending', 'completed', 'registered'],
};
/** States a quick-select can pick on the page, in the order shown. */
const QUICK: EncryptionState[] = ['failed', 'pending', 'not_started', 'completed'];

/** Status of one row's job. Every row asks the per-publication endpoint (cached, shared with the drawer). */
const StatusCell = ({ entry }: { entry: IEntry }) => {
  const { data, isLoading, isError } = useEntryEncryption(entry.id);
  if (isLoading) return <span className="text-zinc-400">…</span>;
  if (isError) return <span className="text-zinc-400">—</span>;
  const state = encryptionState(data);
  return state ? <EncryptionStatusChip state={state} title={data?.encryption?.error_message ?? undefined} /> : null;
};

const UpdatedCell = ({ entry }: { entry: IEntry }) => {
  const { data } = useEntryEncryption(entry.id);
  const job = data?.encryption;
  return <>{fmtDateTime(job?.registered_at ?? job?.encrypted_at) ?? '—'}</>;
};

/** The worker's error, inline, so a page of failures can be read without opening each one. */
const ErrorCell = ({ entry }: { entry: IEntry }) => {
  const { data } = useEntryEncryption(entry.id);
  const message = data?.encryption?.error_message;
  if (!message) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
  return (
    <span className="block max-w-[22rem] truncate text-xs text-redText dark:text-red" title={message}>
      {message}
    </span>
  );
};

const ActionsCell = ({ entry }: { entry: IEntry }) => {
  const { data } = useEntryEncryption(entry.id);
  return <EncryptionControls entryId={entry.id} title={entry.title} state={encryptionState(data)} className="flex-nowrap justify-end" compact />;
};

/**
 * Readium LCP jobs, one row per publication with Readium switched on. The catalog serves no
 * list of jobs to the REST API (only the MCP tool `list_encryption_jobs`, which refuses browser
 * origins), so the publications are listed and each row reads its own job. Bulk "start / retry"
 * works over ticked rows or the whole list (each job is read first, only missing or failed ones
 * are sent); the destructive "re-create" only over rows ticked by hand.
 */
export default function EncryptionJobsTable() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const axios = useAxios();
  const getLicenses = useGetLicenses();
  const api = useJobsApi();
  const bulk = useBulkRunner();
  const selection = useRowSelection<IEntry>((e) => e.id);
  const [allMatching, setAllMatching] = useState(false);
  const [confirm, setConfirm] = useState<BulkAction | null>(null);
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: '-created_at' });
  const [open, setOpen] = useState<IEntry | null>(null);

  const filterQuery = useMemo(() => ({ title: q || undefined, config__readium_enabled: true }), [q]);
  const { data, isLoading, isError, isFetching, refetch } = useEntriesQuery({ page, limit, orderBy, ...filterQuery });
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  // Same keys as the row cells, so this observes (does not duplicate) their requests.
  const statuses = useQueries({
    queries: items.map((e) => ({
      queryKey: ['entry-encryption', e.id],
      queryFn: async () =>
        (await axios.get<{ response: IEntryEncryption }>(`/readium/v1/entries/${e.id}/encryption`)).data.response,
    })),
  });
  const stateOf = new Map(items.map((e, i) => [e.id, encryptionState(statuses[i]?.data)]));
  const pageCounts = QUICK.map((s) => ({ state: s, rows: items.filter((e) => stateOf.get(e.id) === s) }));

  const { clear } = selection;
  useEffect(() => {
    clear();
    setAllMatching(false);
  }, [q, clear]);

  const openEntry = (entry: IEntry) =>
    navigate(NAVIGATION_PATHS.adminEditEntries + entry.id + '?tab=jobs', { state: { from: location.search } });

  /** Ticked rows a bulk action applies to, from the states already loaded. */
  const eligible = (action: BulkAction) =>
    selection.rows.filter((e) => {
      const s = encryptionState(client.getQueryData<IEntryEncryption>(['entry-encryption', e.id]));
      return s ? ELIGIBLE[action].includes(s) : action === 'start';
    });

  // Loans that ever used the packages a bulk re-create would replace (asked when its dialog opens).
  const recreateIds = confirm === 'recreate' ? eligible('recreate').map((e) => e.id) : [];
  const loans = useQuery({
    queryKey: ['bulk-license-count', recreateIds],
    enabled: recreateIds.length > 0,
    queryFn: async () => {
      const counts = await Promise.all(
        recreateIds.map(async (id) => (await getLicenses({ user_mode: 'all', entry_id: id, limit: 1 })).metadata.total)
      );
      return { loans: counts.reduce((a, b) => a + b, 0), withLoans: counts.filter((n) => n > 0).length };
    },
  });

  const actionLabels: Record<BulkAction, string> = {
    start: t('administration.jobs.lcp.bulk.start'),
    recreate: t('administration.jobs.lcp.recreate'),
  };

  const runBulk = (action: BulkAction) => {
    const toItems = (rows: IEntry[]): BulkItem[] => rows.map((e) => ({ id: e.id, label: e.title }));
    bulk.run({
      action,
      items: allMatching ? async (signal) => toItems((await api.collectEntries(filterQuery, signal)).items) : toItems(selection.rows),
      errorFallback: t('administration.jobs.lcp.queueError'),
      // The worker and the LCP server take one job at a time anyway; keep the burst small.
      concurrency: 3,
      task: async (item, signal) => {
        // Read the job first: the row's state may be stale, and the whole-list run has none.
        const state = encryptionState(await api.encryption(item.id));
        if (!state || !ELIGIBLE[action].includes(state)) return 'skipped';
        await (action === 'recreate' ? api.recreateEncryption(item.id, signal) : api.startEncryption(item.id, signal));
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
    { id: 'status', header: t('administration.jobs.columns.status'), hideable: false, cell: (e) => <StatusCell entry={e} /> },
    { id: 'error', header: t('administration.jobs.columns.error'), cell: (e) => <ErrorCell entry={e} /> },
    { id: 'copies', header: t('administration.jobs.columns.copies'), align: 'right', defaultHidden: true, cell: (e) => e.config?.readium_amount ?? '—' },
    { id: 'updated', header: t('administration.jobs.columns.encryptedAt'), cell: (e) => <UpdatedCell entry={e} /> },
    { id: 'created_at', header: t('administration.jobs.columns.created'), sortKey: 'created_at', defaultHidden: true, cell: (e) => fmtDateTime(e.created_at) ?? '—' },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1">
          <ActionsCell entry={e} />
          <IconButton
            label={t('administration.jobs.openPublication')}
            variant="ghost"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              openEntry(e);
            }}
          >
            <FiExternalLink size={14} />
          </IconButton>
        </div>
      ),
    },
  ];

  const pageAllTicked = items.length > 0 && items.every((e) => selection.ids.has(e.id));
  const startCount = allMatching ? null : eligible('start').length;
  const recreateCount = eligible('recreate').length;

  return (
    <>
      <DataTable<IEntry>
        caption={t('administration.jobs.lcp.tableTitle', { count: metadata.total })}
        columns={columns}
        rows={items}
        getRowId={(e) => e.id}
        onRowClick={setOpen}
        loading={isLoading}
        error={isError ? t('administration.jobs.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={t('administration.jobs.lcp.empty')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey="admin-jobs-lcp"
        selection={{
          selected: selection.ids,
          onChange: (rows, checked) => {
            setAllMatching(false);
            selection.onChange(rows, checked);
          },
          rowLabel: (e) => t('administration.bulk.selectRow', { title: e.title }),
          allLabel: t('administration.bulk.selectPage'),
        }}
        banner={
          <>
          {/* The API cannot filter by job state, so the page's own rows can be picked by it. */}
          {items.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{t('administration.jobs.lcp.quickSelect')}</span>
              {pageCounts.map(({ state, rows }) => (
                <button
                  key={state}
                  type="button"
                  disabled={rows.length === 0}
                  onClick={() => {
                    setAllMatching(false);
                    selection.replace(rows);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-0.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {t(`administration.jobs.lcp.status.${state}`)}
                  <span className="tabular-nums text-zinc-400">{rows.length}</span>
                </button>
              ))}
            </div>
          )}
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
              selection.replace(items.filter((e) => ids.has(e.id)));
            }}
            actions={
              <>
                <button
                  type="button"
                  className={bulkBtn}
                  disabled={bulk.busy || startCount === 0}
                  title={t('administration.jobs.lcp.bulk.startHint')}
                  onClick={() => (allMatching ? setConfirm('start') : runBulk('start'))}
                >
                  <FiPlay size={12} /> {actionLabels.start}
                  {startCount != null && <span className="tabular-nums text-zinc-400">({startCount})</span>}
                </button>
                {/* Destructive: never over a whole filter, only over rows ticked one by one. */}
                {!allMatching && (
                  <button
                    type="button"
                    className={bulkBtnDanger}
                    disabled={bulk.busy || recreateCount === 0}
                    title={t('administration.jobs.lcp.recreateHint')}
                    onClick={() => setConfirm('recreate')}
                  >
                    <FiRotateCw size={12} /> {actionLabels.recreate}
                    <span className="tabular-nums opacity-70">({recreateCount})</span>
                  </button>
                )}
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
            <button
              type="button"
              className={bulkBtn}
              disabled={isFetching}
              onClick={() => {
                refetch();
                client.invalidateQueries({ queryKey: ['entry-encryption'] });
              }}
            >
              <FiRefreshCw size={12} className={isFetching ? 'animate-spin' : undefined} /> {t('administration.jobs.refresh')}
            </button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirm !== null}
        destructive={confirm === 'recreate'}
        title={
          confirm === 'recreate'
            ? t('administration.jobs.lcp.bulk.recreateTitle', { count: recreateCount })
            : t('administration.jobs.lcp.bulk.startTitle')
        }
        message={
          confirm === 'recreate'
            ? [
                t('administration.jobs.lcp.bulk.recreateBody', { count: recreateCount }),
                loans.isLoading
                  ? t('administration.jobs.lcp.loansChecking')
                  : loans.isError
                    ? t('administration.jobs.lcp.loansUnknown')
                    : loans.data?.loans
                      ? t('administration.jobs.lcp.bulk.loansWarning', { count: loans.data.loans, entries: loans.data.withLoans })
                      : t('administration.jobs.lcp.bulk.loansNone'),
              ].join(' ')
            : t('administration.jobs.lcp.bulk.startAll', { count: Math.min(metadata.total, BULK_CAP) })
        }
        confirmLabel={confirm ? actionLabels[confirm] : ''}
        cancelLabel={t('administration.usersPage.cancel')}
        loading={confirm === 'recreate' && loans.isLoading}
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
        description={t('administration.jobs.lcp.drawerDescription')}
        width="max-w-xl"
        footer={
          open && (
            <button
              type="button"
              onClick={() => openEntry(open)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight"
            >
              {t('administration.jobs.openPublication')} <FiExternalLink size={13} />
            </button>
          )
        }
      >
        {open && <EntryEncryptionCard entryId={open.id} title={open.title} bare />}
      </Drawer>
    </>
  );
}
