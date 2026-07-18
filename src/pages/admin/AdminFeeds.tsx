import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus, FiFolder, FiEdit2, FiChevronRight } from 'react-icons/fi';
import { MdOutlineCollectionsBookmark } from 'react-icons/md';
import { IFeed } from '../../utils/interfaces/feed';
import { Metadata } from '../../utils/interfaces/general/general';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import useAppContext from '../../hooks/contexts/useAppContext';
import { PageHeader, DataTable, DataTableColumn, SortState, StatusChip, SearchField, IconButton } from '../../components/admin';
import Button from '../../components/buttons/Button';
import FeedDrawer from '../../components/admin/collections/FeedDrawer';

const DEFAULT_LIMIT = 25;

const isFolder = (f: IFeed) => f.kind === 'navigation';

const AdminFeeds = () => {
  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();
  const getFeeds = useGetFeeds();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<IFeed[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [active, setActive] = useState<IFeed | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = searchParams.get('q') || '';
  const orderBy = searchParams.get('order_by') || '';
  // Drill-down chain (folderA&folderB&…). Current level = last segment; top-level otherwise.
  const parentChain = searchParams.get('parent-id')?.split('&').filter(Boolean) ?? [];
  const currentParent = parentChain.length > 0 ? parentChain[parentChain.length - 1] : null;

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

  const drillInto = (folder: IFeed) => {
    const next = new URLSearchParams(searchParams);
    next.set('parent-id', currentParent ? `${searchParams.get('parent-id')}&${folder.id}` : folder.id);
    next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const fetchFeeds = useCallback(async () => {
    if (!selectedCatalogId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await getFeeds({
        page,
        limit,
        paginate: true,
        // 'null' returns top-level feeds; a folder id returns that folder's children.
        parentId: currentParent ?? 'null',
        title: q || undefined,
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
  }, [page, limit, q, orderBy, selectedCatalogId, currentParent]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const openEdit = (f: IFeed) => {
    setActive(f);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openCreate = () => {
    setActive(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<IFeed>[] = [
    {
      id: 'title',
      header: t('administration.collectionsPage.titleCol'),
      sortKey: 'title',
      hideable: false,
      cell: (f) => (
        <span className="flex items-center gap-2.5">
          <span className={isFolder(f) ? 'text-primaryText dark:text-primaryLight' : 'text-zinc-400'}>
            {isFolder(f) ? <FiFolder size={17} /> : <MdOutlineCollectionsBookmark size={17} />}
          </span>
          <span className="font-medium text-secondary dark:text-secondaryLight">{f.title}</span>
          {isFolder(f) && <FiChevronRight size={15} className="text-zinc-400" aria-hidden="true" />}
        </span>
      ),
    },
    {
      id: 'kind',
      header: t('administration.collectionsPage.kind'),
      cell: (f) =>
        isFolder(f) ? (
          <StatusChip variant="info" dot={false}>{t('administration.collectionsPage.kindNavigation')}</StatusChip>
        ) : (
          <StatusChip variant="neutral" dot={false}>{t('administration.collectionsPage.kindAcquisition')}</StatusChip>
        ),
    },
    {
      id: 'children',
      header: t('administration.collectionsPage.children'),
      align: 'right',
      cell: (f) => (isFolder(f) ? (f.children?.length ?? 0).toString() : '—'),
    },
    {
      id: 'url_name',
      header: t('administration.collectionsPage.urlName'),
      defaultHidden: true,
      cell: (f) => <code className="text-xs text-zinc-500 dark:text-zinc-400">{f.url_name}</code>,
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (f) => (
        <IconButton
          label={t('administration.collectionsPage.edit')}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(f);
          }}
        >
          <FiEdit2 size={15} />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.collectionsPage.title')}
        description={t('administration.collectionsPage.description')}
        actions={
          <Button onClick={openCreate} disabled={!selectedCatalogId} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.collectionsPage.add')}
          </Button>
        }
      />

      <DataTable<IFeed>
        caption={t('administration.collectionsPage.title')}
        columns={columns}
        rows={items}
        getRowId={(f) => f.id}
        // Folders drill into their children; leaf collections open for editing.
        onRowClick={(f) => (isFolder(f) ? drillInto(f) : openEdit(f))}
        loading={loading}
        error={error ? t('administration.collectionsPage.loadError') : undefined}
        onRetry={fetchFeeds}
        emptyTitle={selectedCatalogId ? t('administration.collectionsPage.empty') : t('administration.collectionsPage.noCatalog')}
        emptyDescription={selectedCatalogId ? t('administration.collectionsPage.emptyHint') : undefined}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-collections"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.collectionsPage.searchPlaceholder')}
            placeholder={t('administration.collectionsPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <FeedDrawer
        open={drawerOpen}
        feed={active}
        mode={drawerMode}
        catalogId={selectedCatalogId}
        defaultParentId={drawerMode === 'create' ? currentParent : null}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchFeeds}
      />
    </div>
  );
};

export default AdminFeeds;
