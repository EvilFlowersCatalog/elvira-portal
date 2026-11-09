import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiBookOpen } from 'react-icons/fi';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import useDeleteEntry from '../../../hooks/api/entries/useDeleteEntry';
import { IEntry } from '../../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { withAccessToken } from '../../../utils/func/functions';
import { fmtDate, fmtDateTime } from '../../../utils/func/adminDate';
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
import { localize } from '../../../utils/func/localized';
import Select from '../../../components/primitives/Select';
import { useEntryExtraction } from '../../../hooks/api/entries/useEntryExtraction';
import { ExtractionStatusChip } from '../../../components/specific-page/admin-entry-page/extraction/EntryExtractionPanel';

/** Values of the AI-processing filter (`?ai=`), sent as `extraction_status`. */
const EXTRACTION_FILTERS = ['available', 'done', 'none', 'queued', 'running', 'failed', 'unsupported'];

const DEFAULT_LIMIT = 10;

const REGION_STATS = ['figures', 'tables', 'equations'] as const;
type RegionStat = (typeof REGION_STATS)[number];

/**
 * Figures / tables / equations of one entry, summed over its active runs like the
 * list's combined `extraction_regions`. The three cells of a row share one cached
 * request, and entries without regions skip it.
 */
const RegionCountCell = ({ entry, kind }: { entry: IEntry; kind: RegionStat }) => {
  const hasRegions = (entry.extraction_regions ?? 0) > 0;
  const { data, isLoading } = useEntryExtraction(entry.id, hasRegions);
  if (entry.extraction_regions == null) return <>—</>;
  if (!hasRegions) return <>0</>;
  if (isLoading) return <span className="text-zinc-400">…</span>;
  const runs = data?.acquisitions.flatMap((a) => a.runs.filter((r) => r.is_active)) ?? [];
  if (runs.length === 0) return <>—</>;
  return <>{runs.reduce((sum, r) => sum + (r.stats?.[kind] ?? 0), 0).toLocaleString()}</>;
};

const AdminEntries = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { umamiTrack } = useAppContext();
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
  } = useEntriesQuery({
    page,
    limit,
    // Relevance-ranked full-text search (title, summary, author, publisher,
    // category) — same as the public search — instead of title-only.
    query: q || undefined,
    feedId: searchParams.get('feed-id') || undefined,
    categoryId: searchParams.get('category-id') || undefined,
    // AI processing (IP-018): the hidden columns below and the filter.
    extraction: true,
    extractionStatus: searchParams.get('ai') || undefined,
    orderBy,
  });
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? {
    page: 1,
    limit: DEFAULT_LIMIT,
    pages: 1,
    total: 0,
  };

  const openEdit = (e: IEntry, ai = false) => {
    umamiTrack('Edit Entry Button', { entryId: e.id });
    // Remember the list state (search, filters, page, sort) so saving can return to it.
    navigate(NAVIGATION_PATHS.adminEditEntries + e.id + (ai ? '?tab=ai' : ''), { state: { from: location.search } });
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteEntry(pendingDelete.id, pendingDelete.catalog_id || import.meta.env.ELVIRA_CATALOG_ID || undefined);
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

  const thumbSrc = (e: IEntry) => withAccessToken(e.thumbnail, auth?.token);

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
            className="flex min-w-0 max-w-[140px]"
            title={x.title || x.term}
          >
            <StatusChip variant={variant} dot={false} className="min-w-0 max-w-full">
              <span className="truncate">{x.title || x.term}</span>
            </StatusChip>
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
    { id: 'collections', header: t('administration.entriesPage.collections'), cell: (e) => chips(e.feeds?.map((f) => ({ id: f.id, title: localize(f.title) })), 'info', 'feed-id') },
    {
      id: 'categories',
      header: t('administration.entriesPage.categories'),
      defaultHidden: true,
      cell: (e) => chips(e.categories?.map((c) => ({ id: c.id, term: localize(c.label) || c.term })), 'neutral', 'category-id'),
    },
    {
      id: 'files',
      header: t('administration.entriesPage.files'),
      align: 'right',
      cell: (e) => (e.acquisitions?.length ?? 0).toString(),
    },
    {
      id: 'readium',
      header: t('administration.entriesPage.readium'),
      defaultHidden: true,
      cell: (e) =>
        e.config?.readium_enabled ? (
          <StatusChip variant="success" title={t('administration.entriesPage.readiumOnHint', { count: e.config.readium_amount ?? 0 })}>
            {t('administration.entriesPage.readiumOn')}
            {e.config.readium_amount != null && ` · ${e.config.readium_amount}`}
          </StatusChip>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
    {
      id: 'created_at',
      header: t('administration.entriesPage.created'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (e) => fmtDate(e.created_at) ?? '—',
    },
    {
      id: 'extraction_status',
      header: t('administration.entriesPage.aiStatus'),
      sortKey: 'extraction_status',
      defaultHidden: true,
      cell: (e) =>
        e.extraction_status ? (
          <button
            type="button"
            title={t('administration.entriesPage.aiOpen')}
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e, true);
            }}
          >
            <ExtractionStatusChip status={e.extraction_status} />
          </button>
        ) : (
          '—'
        ),
    },
    // The list only carries the combined region count, so the per-kind numbers come
    // from each row's extraction detail (fetched only while one of these is shown).
    ...REGION_STATS.map(
      (kind): DataTableColumn<IEntry> => ({
        id: `extraction_${kind}`,
        header: t(`administration.extraction.stats.${kind}`),
        align: 'right',
        defaultHidden: true,
        cell: (e) => <RegionCountCell entry={e} kind={kind} />,
      })
    ),
    {
      id: 'extraction_paragraphs',
      header: t('administration.entriesPage.aiParagraphs'),
      sortKey: 'extraction_paragraphs',
      firstSortDir: 'desc',
      align: 'right',
      defaultHidden: true,
      cell: (e) => (e.extraction_paragraphs != null ? e.extraction_paragraphs.toLocaleString() : '—'),
    },
    {
      id: 'extraction_finished_at',
      header: t('administration.entriesPage.aiProcessedAt'),
      sortKey: 'extraction_finished_at',
      defaultHidden: true,
      cell: (e) => fmtDateTime(e.extraction_finished_at) ?? '—',
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
          <Button onClick={() => navigate(NAVIGATION_PATHS.adminAddEntries, { state: { from: location.search } })} className="flex items-center gap-2">
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
        emptyTitle={t('administration.entriesPage.empty')}
        emptyDescription={t('administration.entriesPage.emptyHint')}
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
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={q}
              onChange={(v) => patchParams({ q: v || null, page: '1' })}
              label={t('administration.entriesPage.searchPlaceholder')}
              placeholder={t('administration.entriesPage.searchPlaceholder')}
              className="max-w-sm flex-1"
            />
            <Select
              value={searchParams.get('ai') || ''}
              onChange={(v) => patchParams({ ai: v || null, page: '1' })}
              aria-label={t('administration.entriesPage.aiFilter')}
              className="w-72"
              options={[
                { value: '', label: t('administration.entriesPage.aiFilterAll') },
                ...EXTRACTION_FILTERS.map((value) => ({
                  value,
                  label: t(`administration.entriesPage.aiFilterValues.${value}`),
                })),
              ]}
            />
          </div>
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
