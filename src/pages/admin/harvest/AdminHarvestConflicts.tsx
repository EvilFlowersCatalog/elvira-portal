import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiInfo, FiX } from 'react-icons/fi';
import { DataTable, DataTableColumn, PageHeader, StatusChip } from '../../../components/admin';
import Button from '../../../components/buttons/Button';
import Select from '../../../components/primitives/Select';
import { useAcknowledgeConflicts, useHarvestConflicts, useHarvestSources } from '../../../hooks/api/harvest/useHarvest';
import useEntriesQuery from '../../../hooks/api/entries/useEntriesQuery';
import { ConflictValue, IHarvestConflict } from '../../../utils/interfaces/harvest';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';

const DEFAULT_LIMIT = 25;

/** One item of a list value: an author `{name, surname}`, a subject `{term, label}`, or a plain value. */
const itemLabel = (item: ConflictValue): string => {
  if (item === null || item === undefined) return '';
  if (typeof item !== 'object') return String(item);
  if (Array.isArray(item)) return item.map(itemLabel).join(', ');
  const o = item as Record<string, ConflictValue>;
  if (o.surname || o.name) return [o.name, o.surname].filter(Boolean).join(' ');
  if (o.label || o.term) return String(o.label ?? o.term);
  return JSON.stringify(item);
};

/** A conflict value: lists (authors, ISBNs, subjects) as chips, null as "(empty)". */
export function ConflictValueView({ value }: { value: ConflictValue }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <span className="italic text-zinc-400">{t('administration.conflicts.empty')}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
            {itemLabel(item)}
          </span>
        ))}
      </span>
    );
  }
  if (typeof value === 'object') return <code className="break-all text-xs">{JSON.stringify(value)}</code>;
  return <span className="break-words">{String(value)}</span>;
}

/**
 * Sync conflicts (#53, IP-034): fields both Elvira and a synced system changed since the last sync. The later edit
 * won on its own (per-field last write wins); the losing value is kept here so a librarian can see what was
 * overwritten. Nothing waits for approval — "Acknowledge" only marks a conflict as seen.
 */
const AdminHarvestConflicts = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const acknowledge = useAcknowledgeConflicts();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const sourceId = searchParams.get('source_id') || '';
  const entryId = searchParams.get('entry_id') || '';
  const show = (searchParams.get('show') as 'open' | 'all' | null) ?? 'open';

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
      setSelected(new Set());
    },
    [searchParams, setSearchParams]
  );

  const { data, isLoading, isError, refetch } = useHarvestConflicts({
    page,
    limit,
    source_id: sourceId || undefined,
    entry_id: entryId || undefined,
    acknowledged: show === 'open' ? false : undefined,
  });
  const items = useMemo(() => data?.items ?? [], [data]);
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const { data: sourcesData } = useHarvestSources({ limit: 100 });
  const sources = useMemo(() => sourcesData?.items ?? [], [sourcesData]);
  const sourceName = useMemo(() => new Map(sources.map((s) => [s.id, s.name])), [sources]);

  // Titles of the page's entries in one request (the portal's catalog; others show as "Publication").
  const entryIds = useMemo(() => [...new Set([...items.map((c) => c.entry_id), ...(entryId ? [entryId] : [])])], [items, entryId]);
  const { data: entriesData } = useEntriesQuery(
    { page: 1, limit: Math.max(entryIds.length, 1), ids: entryIds.join(',') },
    { enabled: entryIds.length > 0 }
  );
  const entryTitle = useMemo(() => new Map((entriesData?.items ?? []).map((e) => [e.id, e.title])), [entriesData]);

  const ack = async (ids: string[]) => {
    const { ok, failed } = await acknowledge.mutateAsync(ids);
    if (ok) toast.success(t('administration.conflicts.acknowledged', { count: ok }));
    if (failed) toast.error(t('administration.conflicts.ackError', { count: failed }));
    setSelected(new Set());
  };

  const columns: DataTableColumn<IHarvestConflict>[] = [
    {
      id: 'entry',
      header: t('administration.conflicts.entry'),
      hideable: false,
      cell: (c) => (
        <div className="min-w-0 max-w-[16rem]">
          <Link
            to={NAVIGATION_PATHS.adminEditEntries + c.entry_id}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 font-medium text-secondary hover:underline dark:text-secondaryLight"
          >
            {entryTitle.get(c.entry_id) ?? t('administration.conflicts.publication')}
          </Link>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{sourceName.get(c.source_id) ?? '—'}</p>
        </div>
      ),
    },
    {
      id: 'field',
      header: t('administration.conflicts.field'),
      cell: (c) => <span className="text-sm">{t(`administration.harvest.fields.${c.field}`, { defaultValue: c.field })}</span>,
    },
    {
      id: 'values',
      header: t('administration.conflicts.values'),
      hideable: false,
      cell: (c) => {
        const remoteName = sourceName.get(c.source_id) ?? t('administration.conflicts.remote');
        const side = (who: 'local' | 'remote') => {
          const won = c.winner === who;
          return (
            <div
              className={`min-w-0 rounded-md border px-2 py-1.5 ${
                won ? 'border-green-300 bg-green-50 dark:border-green-600/50 dark:bg-green-500/10' : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <p className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {who === 'local' ? t('administration.conflicts.elvira') : remoteName}
                <span>· {fmtDateTime(who === 'local' ? c.local_at : c.remote_at) ?? '—'}</span>
                {won && (
                  <StatusChip variant="success" className="ml-auto">
                    {t('administration.conflicts.won')}
                  </StatusChip>
                )}
              </p>
              <div className="text-sm text-zinc-800 dark:text-zinc-100">
                <ConflictValueView value={who === 'local' ? c.local_value : c.remote_value} />
              </div>
            </div>
          );
        };
        return (
          <div className="grid min-w-[22rem] grid-cols-2 gap-2">
            {side('local')}
            {side('remote')}
          </div>
        );
      },
    },
    {
      id: 'created_at',
      header: t('administration.conflicts.when'),
      defaultHidden: true,
      cell: (c) => fmtDateTime(c.created_at) ?? '—',
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (c) =>
        c.acknowledged ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400" title={fmtDateTime(c.acknowledged_at) ?? undefined}>
            {t('administration.conflicts.seen')}
          </span>
        ) : (
          <button
            type="button"
            disabled={acknowledge.isPending}
            onClick={(e) => {
              e.stopPropagation();
              ack([c.id]);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <FiCheck size={13} />
            {t('administration.conflicts.acknowledge')}
          </button>
        ),
    },
  ];

  const selectedOpen = items.filter((c) => selected.has(c.id) && !c.acknowledged).map((c) => c.id);

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.conflicts.title')} description={t('administration.conflicts.description')} />

      <DataTable<IHarvestConflict>
        caption={t('administration.conflicts.title')}
        columns={columns}
        rows={items}
        getRowId={(c) => c.id}
        loading={isLoading}
        error={isError ? t('administration.conflicts.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={show === 'open' ? t('administration.conflicts.noneOpen') : t('administration.conflicts.none')}
        emptyDescription={t('administration.conflicts.noneHint')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-harvest-conflicts"
        selection={{
          selected,
          onChange: (rows, on) =>
            setSelected((prev) => {
              const next = new Set(prev);
              rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
              return next;
            }),
          isSelectable: (c) => !c.acknowledged,
          rowLabel: (c) => `${entryTitle.get(c.entry_id) ?? c.entry_id} — ${c.field}`,
          allLabel: t('administration.conflicts.selectAll'),
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={show}
              onChange={(v) => patchParams({ show: v === 'open' ? null : v, page: '1' })}
              aria-label={t('administration.conflicts.show')}
              className="w-48"
              options={[
                { value: 'open', label: t('administration.conflicts.showOpen') },
                { value: 'all', label: t('administration.conflicts.showAll') },
              ]}
            />
            <Select
              value={sourceId}
              onChange={(v) => patchParams({ source_id: v || null, page: '1' })}
              aria-label={t('administration.conflicts.source')}
              className="w-56"
              options={[{ value: '', label: t('administration.conflicts.allSources') }, ...sources.map((s) => ({ value: s.id, label: s.name }))]}
            />
            {entryId && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primaryLight px-2.5 py-0.5 text-xs text-primaryText dark:bg-primaryDark dark:text-primaryLight">
                {entryTitle.get(entryId) ?? t('administration.conflicts.publication')}
                <button
                  type="button"
                  aria-label={t('administration.conflicts.clearEntry')}
                  onClick={() => patchParams({ entry_id: null, page: '1' })}
                  className="hover:opacity-70"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {selectedOpen.length > 0 && (
              <Button type="button" onClick={() => ack(selectedOpen)} disabled={acknowledge.isPending} className="ml-auto flex items-center gap-1.5">
                <FiCheck size={14} />
                {t('administration.conflicts.acknowledgeSelected', { count: selectedOpen.length })}
              </Button>
            )}
          </div>
        }
      />

      <p className="mx-5 mt-3 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <FiInfo size={14} className="mt-0.5 shrink-0" />
        {t('administration.conflicts.restoreHint')}
      </p>
    </div>
  );
};

export default AdminHarvestConflicts;
