import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import { ICategory } from '../../utils/interfaces/category';
import { Metadata } from '../../utils/interfaces/general/general';
import { PageHeader, DataTable, DataTableColumn, SortState, SearchField } from '../../components/admin';
import Button from '../../components/buttons/Button';
import CategoryDrawer from '../../components/admin/categories/CategoryDrawer';

const DEFAULT_LIMIT = 25;

const AdminCategories = () => {
  const { t } = useTranslation();
  const getCategories = useGetCategories();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ICategory[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [active, setActive] = useState<ICategory | null>(null);

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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await getCategories({
        page,
        limit,
        query: q || undefined,
        orderBy: orderBy || undefined,
        paginate: true,
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
    fetchCategories();
  }, [fetchCategories]);

  const openEdit = (c: ICategory) => {
    setActive(c);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openCreate = () => {
    setActive(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<ICategory>[] = [
    {
      id: 'label',
      header: t('administration.categoriesPage.label'),
      sortKey: 'label',
      hideable: false,
      cell: (c) => <span className="font-medium text-secondary dark:text-secondaryLight">{c.label}</span>,
    },
    {
      id: 'term',
      header: t('administration.categoriesPage.term'),
      sortKey: 'term',
      cell: (c) => <code className="text-xs text-zinc-500 dark:text-zinc-400">{c.term}</code>,
    },
    {
      id: 'scheme',
      header: t('administration.categoriesPage.scheme'),
      cell: (c) => c.scheme || <span className="text-zinc-400">{t('administration.categoriesPage.none')}</span>,
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.categoriesPage.title')}
        description={t('administration.categoriesPage.description')}
        actions={
          <Button onClick={openCreate} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.categoriesPage.add')}
          </Button>
        }
      />

      <DataTable<ICategory>
        caption={t('administration.categoriesPage.title')}
        columns={columns}
        rows={items}
        getRowId={(c) => c.id}
        onRowClick={openEdit}
        loading={loading}
        error={error ? t('administration.categoriesPage.loadError') : undefined}
        onRetry={fetchCategories}
        emptyTitle={t('administration.categoriesPage.empty')}
        emptyDescription={t('administration.categoriesPage.emptyHint')}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-categories"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.categoriesPage.searchPlaceholder')}
            placeholder={t('administration.categoriesPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <CategoryDrawer
        open={drawerOpen}
        category={active}
        mode={drawerMode}
        catalogId={import.meta.env.ELVIRA_CATALOG_ID}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchCategories}
      />
    </div>
  );
};

export default AdminCategories;
