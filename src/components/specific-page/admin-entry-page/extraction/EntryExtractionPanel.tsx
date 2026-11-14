import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { twMerge } from 'tailwind-merge';
import { FiAlertTriangle, FiCpu, FiInfo, FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import { CircleLoader } from 'react-spinners';
import {
  useEntryExtraction,
  useEntryExtractionParagraphs,
  useEntryExtractionRegions,
  useQueueEntryExtraction,
} from '../../../../hooks/api/entries/useEntryExtraction';
import {
  ExtractionEntryStatus,
  IAcquisitionExtraction,
  IEntryExtraction,
  IExtractionRegion,
  IExtractionRun,
  RegionKind,
} from '../../../../utils/interfaces/extraction';
import { fmtDateTime } from '../../../../utils/func/adminDate';
import { ConfirmDialog, SearchField, StatusChip, StatusVariant, Tabs } from '../../../admin';
import Button from '../../../buttons/Button';
import { RegionCard, RegionDrawer } from './RegionViews';
import JobGroups from './JobGroups';
import { jobGroups } from '../../../../utils/func/extractionJobs';

const card = 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm';
const sectionTitle = 'text-sm font-semibold text-zinc-700 dark:text-zinc-200';

export const STATUS_VARIANT: Record<ExtractionEntryStatus | 'pending', StatusVariant> = {
  done: 'success',
  failed: 'danger',
  running: 'info',
  queued: 'warning',
  pending: 'warning',
  none: 'neutral',
  unsupported: 'neutral',
};

const fmtBytes = (n: number | null) => {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} kB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
};

const fmtDuration = (seconds: number | null) => {
  if (seconds == null) return '—';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ${Math.round(seconds % 60)} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export const ExtractionStatusChip = ({ status }: { status: ExtractionEntryStatus | 'pending' }) => {
  const { t } = useTranslation();
  return <StatusChip variant={STATUS_VARIANT[status] ?? 'neutral'}>{t(`administration.extraction.status.${status}`)}</StatusChip>;
};

const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-700" title={hint}>
    <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
    <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">{value}</p>
  </div>
);

/** Which run's content is shown: the active run, else the newest one. */
const pickRun = (data?: IEntryExtraction): IExtractionRun | null => {
  const runs = data?.acquisitions.flatMap((a) => a.runs) ?? [];
  return runs.find((r) => r.is_active) ?? runs[0] ?? null;
};

/**
 * The "AI processing" tab of a publication: what the IP-018 pipeline exported
 * (figures, tables, equations, paragraphs, outline), its status per file, the
 * service queues and controls to process or re-process — without opening the viewer.
 */
export default function EntryExtractionPanel({ entryId }: { entryId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, isFetching } = useEntryExtraction(entryId);
  const queue = useQueueEntryExtraction(entryId);
  const [confirm, setConfirm] = useState<{ acquisitionId?: string } | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const allRuns = useMemo(() => data?.acquisitions.flatMap((a) => a.runs) ?? [], [data]);
  const run = allRuns.find((r) => r.id === selectedRunId) ?? pickRun(data);

  const submit = async (body: { acquisition_id?: string; force?: boolean }) => {
    try {
      await queue.mutateAsync(body);
      toast.success(t('administration.extraction.queued'));
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.title;
      toast.error(detail || t('administration.extraction.queueError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <CircleLoader size={36} color="#0077cc" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={twMerge(card, 'text-center')}>
        <p className="text-sm text-redText dark:text-red">{t('administration.extraction.loadError')}</p>
        <button type="button" className="mt-3 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight" onClick={() => refetch()}>
          {t('administration.table.retry')}
        </button>
      </div>
    );
  }

  const busy = data.status === 'queued' || data.status === 'running';
  const neverProcessed = data.status === 'none';
  const canQueue = data.enabled && data.status !== 'unsupported';
  const stats = run?.stats;

  return (
    <div className="flex flex-col gap-4">
      {/* What this tab is about */}
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primaryLight/40 p-4 text-sm text-zinc-700 dark:border-primaryLight/20 dark:bg-primaryDark/30 dark:text-zinc-200">
        <FiInfo className="mt-0.5 shrink-0 text-primaryText dark:text-primaryLight" size={18} />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{t('administration.extraction.noteTitle')}</p>
          <p>{t('administration.extraction.noteBody')}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.extraction.noteHint')}</p>
        </div>
      </div>

      {!data.enabled && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          <FiAlertTriangle /> {t('administration.extraction.disabled')}
        </div>
      )}

      {/* Status + controls */}
      <div className={card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <FiCpu className="text-zinc-400" />
              <h2 className={sectionTitle}>{t('administration.extraction.statusTitle')}</h2>
              <ExtractionStatusChip status={data.status} />
              {isFetching && <FiRefreshCw className="animate-spin text-zinc-400" size={12} />}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`administration.extraction.statusHelp.${data.status}`)}</p>
            <p className="text-xs text-zinc-400">
              {t('administration.extraction.pipeline', { version: data.pipeline_version })}
              {run && ` · ${t('administration.extraction.shownRun', { version: run.pipeline_version, date: fmtDateTime(run.finished_at ?? run.created_at) })}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700/50"
            >
              <FiRefreshCw size={14} /> {t('administration.extraction.refresh')}
            </button>
            {neverProcessed || data.status === 'failed' ? (
              <Button type="button" disabled={!canQueue || queue.isPending} onClick={() => submit({})} className="flex items-center gap-2 disabled:opacity-50">
                <FiPlay size={14} />
                {data.status === 'failed' ? t('administration.extraction.retry') : t('administration.extraction.process')}
              </Button>
            ) : (
              <Button type="button" disabled={!canQueue || queue.isPending || busy} onClick={() => setConfirm({})} className="flex items-center gap-2 disabled:opacity-50">
                <FiRotateCw size={14} /> {t('administration.extraction.reprocess')}
              </Button>
            )}
          </div>
        </div>

        {/* Nothing exported yet: say it plainly */}
        {(neverProcessed || data.status === 'unsupported') && (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-600">
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              {data.status === 'unsupported' ? t('administration.extraction.emptyUnsupported') : t('administration.extraction.emptyNone')}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {data.status === 'unsupported' ? t('administration.extraction.emptyUnsupportedHint') : t('administration.extraction.emptyNoneHint')}
            </p>
            {neverProcessed && (
              <Button type="button" disabled={!canQueue || queue.isPending} onClick={() => submit({})} className="mx-auto mt-4 flex items-center gap-2 disabled:opacity-50">
                <FiPlay size={14} /> {t('administration.extraction.addToQueue')}
              </Button>
            )}
          </div>
        )}

        <QueueStatus data={data} />
      </div>

      {/* Numbers */}
      {stats && (
        <div className={card}>
          <h2 className={twMerge(sectionTitle, 'mb-3')}>{t('administration.extraction.statsTitle')}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Stat label={t('administration.extraction.stats.figures')} value={stats.figures} />
            <Stat label={t('administration.extraction.stats.tables')} value={stats.tables} />
            <Stat label={t('administration.extraction.stats.equations')} value={stats.equations} />
            <Stat label={t('administration.extraction.stats.pages')} value={run?.page_count ?? '—'} />
            <Stat label={t('administration.extraction.stats.pagesWithRegions')} value={stats.pages_with_regions} />
            <Stat label={t('administration.extraction.stats.duration')} value={fmtDuration(run?.duration ?? null)} />
            <Stat label={t('administration.extraction.stats.paragraphs')} value={stats.paragraphs.toLocaleString()} />
            <Stat
              label={t('administration.extraction.stats.embedded')}
              value={`${stats.paragraphs_embedded.toLocaleString()} (${pct(stats.paragraphs_embedded, stats.paragraphs)} %)`}
              hint={t('administration.extraction.stats.embeddedHint')}
            />
            <Stat label={t('administration.extraction.stats.sentences')} value={stats.sentences.toLocaleString()} />
            <Stat label={t('administration.extraction.stats.sections')} value={stats.sections} />
            <Stat label={t('administration.extraction.stats.similarLinks')} value={stats.links_similar.toLocaleString()} hint={t('administration.extraction.stats.similarLinksHint')} />
            <Stat
              label={t('administration.extraction.stats.vector')}
              value={stats.has_embedding ? t('administration.extraction.yes') : t('administration.extraction.no')}
              hint={t('administration.extraction.stats.vectorHint')}
            />
            <Stat label={t('administration.extraction.stats.withImage')} value={stats.with_image} />
            <Stat label={t('administration.extraction.stats.printedCaptions')} value={stats.with_printed_caption} />
            <Stat label={t('administration.extraction.stats.descriptions')} value={stats.with_description} hint={t('administration.extraction.stats.descriptionsHint')} />
            <Stat label={t('administration.extraction.stats.characters')} value={stats.characters.toLocaleString()} />
            <Stat label={t('administration.extraction.stats.nextLinks')} value={stats.links_next.toLocaleString()} />
          </div>
        </div>
      )}

      {/* What was exported */}
      {run && (
        <ExportedContents
          entryId={entryId}
          data={data}
          run={run}
          runs={allRuns}
          onRunChange={setSelectedRunId}
        />
      )}

      {/* Files and run history */}
      <div className={card}>
        <h2 className={twMerge(sectionTitle, 'mb-3')}>{t('administration.extraction.filesTitle')}</h2>
        <div className="flex flex-col gap-3">
          {data.acquisitions.length === 0 && <p className="text-sm text-zinc-500">{t('administration.extraction.noFiles')}</p>}
          {data.acquisitions.map((acquisition) => (
            <AcquisitionRow
              key={acquisition.id}
              acquisition={acquisition}
              canQueue={data.enabled && !queue.isPending}
              onProcess={(force) => (force ? setConfirm({ acquisitionId: acquisition.id }) : submit({ acquisition_id: acquisition.id }))}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={t('administration.extraction.reprocessConfirmTitle')}
        message={t('administration.extraction.reprocessConfirmBody')}
        confirmLabel={t('administration.extraction.reprocess')}
        cancelLabel={t('administration.usersPage.cancel')}
        onConfirm={() => {
          const body = { force: true, ...(confirm?.acquisitionId ? { acquisition_id: confirm.acquisitionId } : {}) };
          setConfirm(null);
          submit(body);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/** Jobs of the run in progress, where its task waits, and how busy every service queue is. */
function QueueStatus({ data }: { data: IEntryExtraction }) {
  const { t } = useTranslation();
  const inProgress = data.acquisitions.filter((a) => a.status === 'queued' || a.status === 'running');
  const anyDepth = data.queues.some((q) => q.waiting != null);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-700/60">
      {inProgress.map((acquisition) => {
        const latest = acquisition.runs[0];
        // Counts come from the groups: with per-batch dispatch `jobs` holds hundreds of entries.
        const groups = latest ? jobGroups(latest) : [];
        const reported = groups.reduce((sum, g) => sum + g.done + g.failed, 0);
        const total = groups.reduce((sum, g) => sum + g.total, 0);
        return (
          <div key={acquisition.id} className="flex flex-col gap-2 text-sm">
            <p className="text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">{acquisition.name ?? acquisition.id}</span>
              {' — '}
              {acquisition.task?.waiting
                ? t('administration.extraction.queue.waiting', { position: acquisition.task.position })
                : acquisition.status === 'queued'
                  ? acquisition.task?.waiting === false
                    ? t('administration.extraction.queue.taken')
                    : t('administration.extraction.queue.unknown')
                  : t('administration.extraction.queue.running', { done: reported, total })}
            </p>
            {latest && <JobGroups run={latest} />}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">{t('administration.extraction.queue.title')}</span>
        {anyDepth ? (
          data.queues.map((q) => (
            <span key={q.queue} title={q.queue} className="tabular-nums">
              {t(`administration.extraction.jobs.${q.service}`, { defaultValue: q.service })}: {q.waiting ?? '—'}
            </span>
          ))
        ) : (
          <span>{t('administration.extraction.queue.unavailable')}</span>
        )}
      </div>
    </div>
  );
}

function AcquisitionRow({
  acquisition,
  canQueue,
  onProcess,
}: {
  acquisition: IAcquisitionExtraction;
  canQueue: boolean;
  onProcess: (force: boolean) => void;
}) {
  const { t } = useTranslation();
  const busy = acquisition.status === 'queued' || acquisition.status === 'running';
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100" title={acquisition.name ?? ''}>
            {acquisition.name ?? acquisition.id}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {acquisition.mime} · {fmtBytes(acquisition.size)}
            {acquisition.relation && ` · ${acquisition.relation}`}
          </p>
        </div>
        {acquisition.extractable ? (
          <ExtractionStatusChip status={acquisition.status} />
        ) : (
          <StatusChip variant="neutral">{t(`administration.extraction.reason.${acquisition.reason}`)}</StatusChip>
        )}
        {acquisition.outdated && <StatusChip variant="warning">{t('administration.extraction.outdated')}</StatusChip>}
        {acquisition.available && acquisition.status !== 'done' && (
          <StatusChip variant="success" dot={false}>{t('administration.extraction.stillServed')}</StatusChip>
        )}
        {acquisition.extractable && (
          <button
            type="button"
            disabled={!canQueue || busy}
            onClick={() => onProcess(acquisition.status === 'done')}
            className="rounded-md px-2 py-1 text-xs font-medium text-primaryText hover:bg-primaryLight disabled:opacity-40 dark:text-primaryLight dark:hover:bg-primaryDark"
          >
            {acquisition.status === 'done'
              ? t('administration.extraction.reprocess')
              : acquisition.status === 'none'
                ? t('administration.extraction.process')
                : busy
                  ? t('administration.extraction.inProgress')
                  : t('administration.extraction.retry')}
          </button>
        )}
      </div>

      {acquisition.runs.length > 0 && (
        <details className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-700/60">
          <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">
            {t('administration.extraction.runs', { count: acquisition.runs.length })}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {acquisition.runs.map((run) => (
              <div key={run.id} className="rounded-md bg-zinc-50 p-2.5 text-xs dark:bg-zinc-900/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">v{run.pipeline_version}</span>
                  <ExtractionStatusChip status={run.status} />
                  {run.is_active && <StatusChip variant="success" dot={false}>{t('administration.extraction.active')}</StatusChip>}
                  <span className="text-zinc-500">
                    {t('administration.extraction.created')}: {fmtDateTime(run.created_at)}
                    {run.started_at && ` · ${t('administration.extraction.started')}: ${fmtDateTime(run.started_at)}`}
                    {run.finished_at && ` · ${t('administration.extraction.finished')}: ${fmtDateTime(run.finished_at)}`}
                    {run.duration != null && ` · ${fmtDuration(run.duration)}`}
                  </span>
                </div>
                <div className="mt-2">
                  <JobGroups run={run} compact />
                </div>
                {run.error && (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-red/10 p-2 text-[11px] text-redText dark:text-red">{run.error}</pre>
                )}
                <p className="mt-1.5 font-mono text-[10px] text-zinc-400">{run.storage_dir}</p>
                {Object.keys(run.provenance ?? {}).length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-zinc-500">{t('administration.extraction.provenance')}</summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[10px] dark:bg-zinc-900">{JSON.stringify(run.provenance, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

type ContentTab = 'contents' | RegionKind | 'paragraphs';

/** What the run exported, as the viewer shows it: outline, figures, tables, equations, paragraphs. */
function ExportedContents({
  entryId,
  data,
  run,
  runs,
  onRunChange,
}: {
  entryId: string;
  data: IEntryExtraction;
  run: IExtractionRun;
  runs: IExtractionRun[];
  onRunChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ContentTab>('figure');
  const [open, setOpen] = useState<IExtractionRegion | null>(null);
  const { data: regions = [], isLoading } = useEntryExtractionRegions(entryId, run.id);
  const toc = data.table_of_contents ?? [];

  const byKind = (kind: RegionKind) => regions.filter((r) => r.kind === kind);
  const stats = run.stats;

  return (
    <div className={card}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}>{t('administration.extraction.exportedTitle')}</h2>
        {runs.length > 1 && (
          <select
            value={run.id}
            onChange={(e) => onRunChange(e.target.value)}
            aria-label={t('administration.extraction.runPicker')}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                v{r.pipeline_version} · {t(`administration.extraction.status.${r.status}`)}
                {r.is_active ? ` · ${t('administration.extraction.active')}` : ''} · {fmtDateTime(r.created_at)}
              </option>
            ))}
          </select>
        )}
      </div>

      <Tabs
        className="px-0"
        label={t('administration.extraction.exportedTitle')}
        active={tab}
        onChange={(id) => setTab(id as ContentTab)}
        tabs={[
          { id: 'figure', label: t('administration.extraction.kindPlural.figure'), count: stats?.figures ?? byKind('figure').length },
          { id: 'table', label: t('administration.extraction.kindPlural.table'), count: stats?.tables ?? byKind('table').length },
          { id: 'equation', label: t('administration.extraction.kindPlural.equation'), count: stats?.equations ?? byKind('equation').length },
          { id: 'paragraphs', label: t('administration.extraction.paragraphsTab'), count: stats?.paragraphs ?? null },
          { id: 'contents', label: t('administration.extraction.contentsTab'), count: toc.length },
        ]}
      />

      <div className="mt-4">
        {tab === 'contents' ? (
          <Outline toc={toc} />
        ) : tab === 'paragraphs' ? (
          <Paragraphs entryId={entryId} runId={run.id} />
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <CircleLoader size={28} color="#0077cc" />
          </div>
        ) : byKind(tab).length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('administration.extraction.noneOfKind', { kind: t(`administration.extraction.kindPlural.${tab}`).toLowerCase() })}
          </p>
        ) : (
          <div
            className={twMerge(
              'grid gap-3',
              tab === 'table' ? 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(180px,1fr))]'
            )}
          >
            {byKind(tab).map((region) => (
              <RegionCard key={region.id} region={region} onOpen={() => setOpen(region)} />
            ))}
          </div>
        )}
      </div>

      <RegionDrawer region={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Outline({ toc }: { toc: { level: number; title: string; page: number }[] }) {
  const { t } = useTranslation();
  if (!toc.length) return <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{t('administration.extraction.noContents')}</p>;
  const top = Math.min(...toc.map((h) => h.level));
  return (
    <ol className="flex flex-col">
      {toc.map((heading, index) => {
        const depth = Math.max(0, heading.level - top);
        return (
          <li
            key={index}
            style={{ paddingLeft: `${Math.min(depth, 5) * 16}px` }}
            className={twMerge(
              'flex items-baseline gap-3 border-b border-zinc-100 py-1.5 dark:border-zinc-700/60',
              depth === 0 ? 'text-sm font-medium text-zinc-800 dark:text-zinc-100' : 'text-xs text-zinc-600 dark:text-zinc-300'
            )}
          >
            <span className="min-w-0 flex-1">{heading.title}</span>
            <span className="shrink-0 tabular-nums text-zinc-400">{heading.page}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Paragraphs({ entryId, runId }: { entryId: string; runId: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const { data, isLoading, isFetching } = useEntryExtractionParagraphs(entryId, { runId, page, limit: 20, query });

  return (
    <div className="flex flex-col gap-3">
      <SearchField
        value={query}
        onChange={(v) => {
          setQuery(v);
          setPage(1);
        }}
        label={t('administration.extraction.paragraphSearch')}
        placeholder={t('administration.extraction.paragraphSearch')}
        className="max-w-sm"
      />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <CircleLoader size={28} color="#0077cc" />
        </div>
      ) : !data?.items.length ? (
        <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{t('administration.extraction.noParagraphs')}</p>
      ) : (
        <ol className={twMerge('flex flex-col gap-2 transition-opacity', isFetching && 'opacity-60')}>
          {data.items.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="tabular-nums">#{p.seq}</span>
                <span>{t('administration.extraction.regions.page', { page: p.page })}</span>
                {p.section && <span className="truncate font-medium text-zinc-600 dark:text-zinc-300">§ {p.section}</span>}
                <span>{t('administration.extraction.sentences', { count: p.sentences })}</span>
                <StatusChip variant={p.embedded ? 'success' : 'neutral'} className="px-1.5 py-0 text-[10px]">
                  {p.embedded ? t('administration.extraction.embedded') : t('administration.extraction.notEmbedded')}
                </StatusChip>
                {p.similar > 0 && <span>{t('administration.extraction.similar', { count: p.similar })}</span>}
              </div>
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-200">{p.text}</p>
            </li>
          ))}
        </ol>
      )}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="tabular-nums text-zinc-500">{t('administration.table.pageOf', { page: data.page, pages: data.pages })}</span>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-600">
            ‹
          </button>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-600">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
