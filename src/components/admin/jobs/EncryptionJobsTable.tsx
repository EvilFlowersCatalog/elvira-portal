import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import { useEntryEncryption } from '../../../hooks/api/encryption/useEntryEncryption';
import useTableParams from '../../../hooks/useTableParams';
import { IEntry } from '../../../utils/interfaces/entry';
import { encryptionState } from '../../../utils/interfaces/encryption';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import SearchField from '../SearchField';
import Drawer from '../Drawer';
import IconButton from '../IconButton';
import EncryptionControls, { EncryptionStatusChip } from './EncryptionControls';
import EntryEncryptionCard from './EntryEncryptionCard';

const DEFAULT_LIMIT = 20;

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

const ActionsCell = ({ entry }: { entry: IEntry }) => {
  const { data } = useEntryEncryption(entry.id);
  return <EncryptionControls entryId={entry.id} title={entry.title} state={encryptionState(data)} className="flex-nowrap justify-end" compact />;
};

/**
 * Readium LCP jobs, one row per publication with Readium switched on. The catalog serves no
 * list of jobs to the REST API (only the MCP tool `list_encryption_jobs`, which refuses browser
 * origins), so the publications are listed and each row reads its own job.
 */
export default function EncryptionJobsTable() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: '-created_at' });
  const [open, setOpen] = useState<IEntry | null>(null);

  const { data, isLoading, isError, refetch } = useEntriesQuery({
    page,
    limit,
    title: q || undefined,
    orderBy,
    config__readium_enabled: true,
  });
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const openEntry = (entry: IEntry) =>
    navigate(NAVIGATION_PATHS.adminEditEntries + entry.id + '?tab=jobs', { state: { from: location.search } });

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
        toolbar={
          <SearchField
            value={q}
            onChange={setQuery}
            label={t('administration.jobs.search')}
            placeholder={t('administration.jobs.search')}
            className="max-w-sm"
          />
        }
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
