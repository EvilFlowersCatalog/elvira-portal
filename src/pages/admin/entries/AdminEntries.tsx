import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiBookOpen } from 'react-icons/fi';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import useDeleteEntry from '../../../hooks/api/entries/useDeleteEntry';
import { IEntry } from '../../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  SortState,
  StatusChip,
  SearchField,
  IconButton,
  ConfirmDialog,
} from '../../../components/admin';
import Button from '../../../components/buttons/Button';

const DEFAULT_LIMIT = 10;

const AdminEntries = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedCatalogId, umamiTrack } = useAppContext();
  const { auth } = useAuthContext();
  const deleteEntry = useDeleteEntry();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pendingDelete, setPendingDelete] = useState<IEntry | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = searchParams.get('q') || '';
  const orderBy = searchParams.get('order_by') || '';
  const sort: SortState | null = orderBy
    ? { key: orderBy.replace(/^-/, ''), dir: orderBy.startsWith('-') ? 'desc' : 'asc' }
    : null;

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const {
    data,
    isLoading: loading,
    isError: error,
    refetch,
  } = useEntriesQuery(
    { page, limit, title: q, orderBy },
    { enabled: !!selectedCatalogId }
  );
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? {
    page: 1,
    limit: DEFAULT_LIMIT,
    pages: 1,
    total: 0,
  };

  const openEdit = (e: IEntry) => {
    umamiTrack('Edit Entry Button', { entryId: e.id });
    navigate(NAVIGATION_PATHS.adminEditEntries + e.id);
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteEntry(pendingDelete.id, pendingDelete.catalog_id || selectedCatalogId || undefined);
      toast.success(t('administration.entriesPage.deleted'));
      refetch();
    } catch {
      toast.error(t('administration.entriesPage.deleteError'));
    } finally {
      setPendingDelete(null);
    }
  };

  const authorLine = (e: IEntry) => {
    const a = e.authors ?? [];
    if (a.length === 0) return '—';
    const first = [a[0].name, a[0].surname].filter(Boolean).join(' ').trim();
    return a.length > 1 ? `${first} ${t('administration.entriesPage.moreCount', { count: a.length - 1 })}` : first;
  };

  const thumbSrc = (e: IEntry) => (e.thumbnail ? `${e.thumbnail}?access_token=${auth?.token}` : null);

  const chips = (arr: { id: string; title?: string; term?: string }[] | undefined, variant: 'info' | 'neutral', param: string) => {
    if (!arr || arr.length === 0) return <span className="text-zinc-400">—</span>;
    const shown = arr.slice(0, 2);
    return (
      <div className="flex flex-wrap items-center gap-1">
        {shown.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              patchParams({ [param]: x.id, page: '1' });
            }}
            className="max-w-[140px] truncate"
            title={x.title || x.term}
          >
            <StatusChip variant={variant} dot={false}>{x.title || x.term}</StatusChip>
          </button>
        ))}
        {arr.length > 2 && <span className="text-xs text-zinc-400">{t('administration.entriesPage.moreCount', { count: arr.length - 2 })}</span>}
      </div>
    );
  };

  const columns: DataTableColumn<IEntry>[] = [
    {
      id: 'title',
      header: t('administration.entriesPage.publication'),
      sortKey: 'title',
      hideable: false,
      cell: (e) => {
        const src = thumbSrc(e);
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-700">
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-500">
                  <FiBookOpen size={16} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-secondary dark:text-secondaryLight">{e.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{authorLine(e)}</p>
            </div>
          </div>
        );
      },
    },
    { id: 'collections', header: t('administration.entriesPage.collections'), cell: (e) => chips(e.feeds, 'info', 'feed-id') },
    {
      id: 'categories',
      header: t('administration.entriesPage.categories'),
      defaultHidden: true,
      cell: (e) => chips(e.categories?.map((c) => ({ id: c.id, term: c.term })), 'neutral', 'category-id'),
    },
    {
      id: 'files',
      header: t('administration.entriesPage.files'),
      align: 'right',
      cell: (e) => (e.acquisitions?.length ?? 0).toString(),
    },
    {
      id: 'created_at',
      header: t('administration.entriesPage.created'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (e) => (e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'),
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <IconButton label={t('administration.entriesPage.edit')} variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}>
            <FiEdit2 size={15} />
          </IconButton>
          <IconButton label={t('administration.entriesPage.delete')} variant="danger" size="sm" onClick={(ev) => { ev.stopPropagation(); setPendingDelete(e); }}>
            <FiTrash2 size={15} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.entriesPage.title')}
        description={t('administration.entriesPage.description')}
        actions={
          <Button onClick={() => navigate(NAVIGATION_PATHS.adminAddEntries)} disabled={!selectedCatalogId} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.entriesPage.add')}
          </Button>
        }
      />

      <DataTable<IEntry>
        caption={t('administration.entriesPage.tableTitle')}
        columns={columns}
        rows={items}
        getRowId={(e) => e.id}
        onRowClick={openEdit}
        loading={loading}
        error={error ? t('administration.entriesPage.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={selectedCatalogId ? t('administration.entriesPage.empty') : t('administration.entriesPage.noCatalog')}
        emptyDescription={selectedCatalogId ? t('administration.entriesPage.emptyHint') : undefined}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-publications"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.entriesPage.searchPlaceholder')}
            placeholder={t('administration.entriesPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('administration.entriesPage.deleteConfirmTitle')}
        message={t('administration.entriesPage.deleteConfirmBody', { name: pendingDelete?.title ?? '' })}
        confirmLabel={t('administration.entriesPage.delete')}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        onConfirm={doDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default AdminEntries;
