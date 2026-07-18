import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { ICatalog } from '../../utils/interfaces/catalog';
import { Metadata } from '../../utils/interfaces/general/general';
import { useListCatalogs } from '../../hooks/api/catalogs/useAdminCatalogs';
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  SortState,
  StatusChip,
  SearchField,
} from '../../components/admin';
import Button from '../../components/buttons/Button';
import CatalogDrawer from '../../components/admin/catalogs/CatalogDrawer';

const DEFAULT_LIMIT = 10;

const AdminCatalogs = () => {
  const { t } = useTranslation();
  const listCatalogs = useListCatalogs();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ICatalog[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [active, setActive] = useState<ICatalog | null>(null);

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

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await listCatalogs({ page, limit, title: q || undefined, orderBy: orderBy || undefined });
      setItems(items);
      setMetadata(metadata);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, orderBy]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const openEdit = (c: ICatalog) => {
    setActive(c);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openCreate = () => {
    setActive(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<ICatalog>[] = [
    {
      id: 'title',
      header: t('administration.catalogsPage.titleCol'),
      sortKey: 'title',
      hideable: false,
      cell: (c) => <span className="font-medium text-secondary dark:text-secondaryLight">{c.title}</span>,
    },
    {
      id: 'url_name',
      header: t('administration.catalogsPage.urlName'),
      sortKey: 'url_name',
      cell: (c) => <code className="text-xs text-zinc-500 dark:text-zinc-400">{c.url_name}</code>,
    },
    {
      id: 'is_public',
      header: t('administration.catalogsPage.visibility'),
      cell: (c) =>
        c.is_public ? (
          <StatusChip variant="success">{t('administration.catalogsPage.public')}</StatusChip>
        ) : (
          <StatusChip variant="neutral">{t('administration.catalogsPage.private')}</StatusChip>
        ),
    },
    {
      id: 'created_at',
      header: t('administration.catalogsPage.createdAt'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (c) => (c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.catalogsPage.title')}
        description={t('administration.catalogsPage.description')}
        actions={
          <Button onClick={openCreate} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.catalogsPage.add')}
          </Button>
        }
      />

      <DataTable<ICatalog>
        caption={t('administration.catalogsPage.title')}
        columns={columns}
        rows={items}
        getRowId={(c) => c.id}
        onRowClick={openEdit}
        loading={loading}
        error={error ? t('administration.catalogsPage.loadError') : undefined}
        onRetry={fetchCatalogs}
        emptyTitle={t('administration.catalogsPage.empty')}
        emptyDescription={t('administration.catalogsPage.emptyHint')}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-catalogs"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.catalogsPage.searchPlaceholder')}
            placeholder={t('administration.catalogsPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <CatalogDrawer
        open={drawerOpen}
        catalog={active}
        mode={drawerMode}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchCatalogs}
      />
    </div>
  );
};

export default AdminCatalogs;
