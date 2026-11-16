import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { DataTable, DataTableColumn, PageHeader, SearchField, Switch } from '../../../components/admin';
import StatusChip from '../../../components/admin/StatusChip';
import Button from '../../../components/buttons/Button';
import Select from '../../../components/primitives/Select';
import HarvestSourceDrawer from '../../../components/admin/harvest/HarvestSourceDrawer';
import { MODE_VARIANT, describeSchedule, summarizeReport } from '../../../components/admin/harvest/harvestFormat';
import { useHarvestClient, useHarvestConnectors, useHarvestSources } from '../../../hooks/api/harvest/useHarvest';
import { useCatalogTitles } from '../../../hooks/api/catalogs/useCatalogTitles';
import { IHarvestSource } from '../../../utils/interfaces/harvest';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';

const DEFAULT_LIMIT = 20;

/**
 * Harvest sources (#51, IP-034): one connection each to another system (an OAI-PMH catalogue, a MARC file, Dataverse)
 * and what it does to one Elvira catalog. A row opens the source's own page (test, dry run, records).
 */
const AdminHarvest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const api = useHarvestClient();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = searchParams.get('q') || '';
  const catalogId = searchParams.get('catalog') || '';
  const adapter = searchParams.get('adapter') || '';

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const { data, isLoading, isError, refetch } = useHarvestSources({
    page,
    limit,
    query: q || undefined,
    target_catalog_id: catalogId || undefined,
    adapter: adapter || undefined,
  });
  const { data: connectors = [] } = useHarvestConnectors();
  const { data: catalogs = [] } = useCatalogTitles();

  const catalogTitle = useMemo(() => new Map(catalogs.map((c) => [c.id, c.title])), [catalogs]);
  const connectorTitle = useMemo(() => new Map(connectors.map((c) => [c.name, c.title])), [connectors]);

  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  const openSource = (s: IHarvestSource) => navigate(`${NAVIGATION_PATHS.adminHarvest}/${s.id}`);

  // The PUT needs the required fields every time; optional ones not sent keep their value.
  const toggleEnabled = async (s: IHarvestSource, enabled: boolean) => {
    try {
      await api.update(s.id, {
        slug: s.slug,
        name: s.name,
        adapter: s.adapter,
        system_key: s.system_key,
        target_catalog_id: s.target_catalog_id,
        enabled,
      });
      toast.success(enabled ? t('administration.harvest.list.enabledOn', { name: s.name }) : t('administration.harvest.list.enabledOff', { name: s.name }));
    } catch (e) {
      toast.error(problemDetailMessage(e, t('administration.harvest.form.saveError')));
    }
  };

  const columns: DataTableColumn<IHarvestSource>[] = [
    {
      id: 'name',
      header: t('administration.harvest.list.name'),
      hideable: false,
      cell: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-secondary dark:text-secondaryLight">{s.name}</p>
          <p className="truncate font-mono text-xs text-zinc-400">{s.slug}</p>
        </div>
      ),
    },
    {
      id: 'adapter',
      header: t('administration.harvest.list.connector'),
      cell: (s) => <span className="text-sm text-zinc-700 dark:text-zinc-200">{connectorTitle.get(s.adapter) ?? s.adapter}</span>,
    },
    {
      id: 'catalog',
      header: t('administration.harvest.list.catalog'),
      cell: (s) => <span className="text-sm text-zinc-700 dark:text-zinc-200">{catalogTitle.get(s.target_catalog_id) ?? '—'}</span>,
    },
    {
      id: 'mode',
      header: t('administration.harvest.list.mode'),
      cell: (s) => <StatusChip variant={MODE_VARIANT[s.mode] ?? 'neutral'}>{t(`administration.harvest.mode.${s.mode}`)}</StatusChip>,
    },
    {
      id: 'enabled',
      header: t('administration.harvest.list.enabled'),
      cell: (s) => (
        // The row opens the source; the switch must not.
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch
            checked={s.enabled}
            onChange={(v) => toggleEnabled(s, v)}
            label={s.enabled ? t('administration.harvest.list.on') : t('administration.harvest.list.off')}
          />
        </div>
      ),
    },
    {
      id: 'schedule',
      header: t('administration.harvest.list.schedule'),
      cell: (s) => (
        <span className="text-sm text-zinc-700 dark:text-zinc-200" title={s.schedule || undefined}>
          {describeSchedule(s.schedule, t)}
        </span>
      ),
    },
    {
      id: 'last_run',
      header: t('administration.harvest.list.lastRun'),
      cell: (s) =>
        s.last_run_at ? (
          <div className="min-w-0">
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              {fmtDateTime(s.last_run_at)}
              {s.last_report?.dry_run && (
                <span className="ml-1.5 rounded bg-zinc-100 px-1 py-0.5 text-[10px] uppercase text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                  {t('administration.harvest.dryRunTag')}
                </span>
              )}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{summarizeReport(s.last_report, t) ?? ''}</p>
          </div>
        ) : (
          <span className="text-zinc-400">{t('administration.harvest.list.never')}</span>
        ),
    },
  ];

  const emptyState = !isLoading && !isError && items.length === 0 && !q && !catalogId && !adapter;

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.harvest.list.title')}
        description={t('administration.harvest.list.description')}
        actions={
          <Button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.harvest.list.add')}
          </Button>
        }
      />

      {emptyState ? (
        <section className="mx-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-600 dark:bg-zinc-800">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight">
            <FiRefreshCw size={22} />
          </span>
          <h2 className="text-lg font-semibold text-secondary dark:text-secondaryLight">{t('administration.harvest.empty.title')}</h2>
          <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">{t('administration.harvest.empty.body')}</p>
          <ul className="max-w-xl list-disc space-y-1 pl-5 text-left text-sm text-zinc-600 dark:text-zinc-300">
            {(['link_only', 'enrich', 'create', 'sync'] as const).map((m) => (
              <li key={m}>
                <strong>{t(`administration.harvest.mode.${m}`)}</strong> — {t(`administration.harvest.modeHint.${m}`)}
              </li>
            ))}
          </ul>
          <Button onClick={() => setDrawerOpen(true)} className="mt-2 flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.harvest.list.add')}
          </Button>
        </section>
      ) : (
        <DataTable<IHarvestSource>
          caption={t('administration.harvest.list.title')}
          columns={columns}
          rows={items}
          getRowId={(s) => s.id}
          onRowClick={openSource}
          loading={isLoading}
          error={isError ? t('administration.harvest.list.loadError') : undefined}
          onRetry={() => refetch()}
          emptyTitle={t('administration.harvest.list.noMatch')}
          page={metadata.page}
          pageCount={metadata.pages}
          total={metadata.total}
          pageSize={metadata.limit}
          onPageChange={(p) => patchParams({ page: String(p) })}
          onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
          storageKey="admin-harvest-sources"
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField
                value={q}
                onChange={(v) => patchParams({ q: v || null, page: '1' })}
                label={t('administration.harvest.list.search')}
                placeholder={t('administration.harvest.list.search')}
                className="max-w-sm flex-1"
              />
              <Select
                value={catalogId}
                onChange={(v) => patchParams({ catalog: v || null, page: '1' })}
                aria-label={t('administration.harvest.list.catalog')}
                className="w-56"
                options={[{ value: '', label: t('administration.harvest.list.allCatalogs') }, ...catalogs.map((c) => ({ value: c.id, label: c.title }))]}
              />
              <Select
                value={adapter}
                onChange={(v) => patchParams({ adapter: v || null, page: '1' })}
                aria-label={t('administration.harvest.list.connector')}
                className="w-48"
                options={[{ value: '', label: t('administration.harvest.list.allConnectors') }, ...connectors.map((c) => ({ value: c.name, label: c.title }))]}
              />
            </div>
          }
        />
      )}

      <HarvestSourceDrawer
        open={drawerOpen}
        source={null}
        onClose={() => setDrawerOpen(false)}
        onSaved={(saved) => navigate(`${NAVIGATION_PATHS.adminHarvest}/${saved.id}`)}
      />
    </div>
  );
};

export default AdminHarvest;
