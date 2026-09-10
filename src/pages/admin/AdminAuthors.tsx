import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { IAuthor } from '../../utils/interfaces/author';
import { Metadata } from '../../utils/interfaces/general/general';
import { useListAuthors } from '../../hooks/api/authors/useAdminAuthors';
import { PageHeader, DataTable, DataTableColumn, SortState, SearchField } from '../../components/admin';
import Button from '../../components/buttons/Button';
import AuthorDrawer from '../../components/admin/authors/AuthorDrawer';

const DEFAULT_LIMIT = 10;

const AdminAuthors = () => {
  const { t } = useTranslation();
  const listAuthors = useListAuthors();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<IAuthor[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [active, setActive] = useState<IAuthor | null>(null);

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

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await listAuthors({
        catalog_id: import.meta.env.ELVIRA_CATALOG_ID,
        page,
        limit,
        query: q || undefined,
        orderBy: orderBy || undefined,
      });
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
    fetchAuthors();
  }, [fetchAuthors]);

  const openEdit = (a: IAuthor) => {
    setActive(a);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openCreate = () => {
    setActive(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<IAuthor>[] = [
    {
      id: 'name',
      header: t('administration.authorsPage.name'),
      sortKey: 'name',
      cell: (a) => a.name || '—',
    },
    {
      id: 'surname',
      header: t('administration.authorsPage.surname'),
      sortKey: 'surname',
      hideable: false,
      cell: (a) => <span className="font-medium text-secondary dark:text-secondaryLight">{a.surname || '—'}</span>,
    },
    {
      id: 'created_at',
      header: t('administration.authorsPage.createdAt'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (a) => (a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.authorsPage.title')}
        description={t('administration.authorsPage.description')}
        actions={
          <Button onClick={openCreate} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.authorsPage.add')}
          </Button>
        }
      />

      <DataTable<IAuthor>
        caption={t('administration.authorsPage.title')}
        columns={columns}
        rows={items}
        getRowId={(a) => a.id}
        onRowClick={openEdit}
        loading={loading}
        error={error ? t('administration.authorsPage.loadError') : undefined}
        onRetry={fetchAuthors}
        emptyTitle={t('administration.authorsPage.empty')}
        emptyDescription={t('administration.authorsPage.emptyHint')}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-authors"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.authorsPage.searchPlaceholder')}
            placeholder={t('administration.authorsPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <AuthorDrawer
        open={drawerOpen}
        author={active}
        mode={drawerMode}
        catalogId={import.meta.env.ELVIRA_CATALOG_ID}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchAuthors}
      />
    </div>
  );
};

export default AdminAuthors;
