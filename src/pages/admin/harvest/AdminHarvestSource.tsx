import { ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiActivity, FiAlertTriangle, FiEdit2, FiPlay, FiUploadCloud, FiWifi, FiZap } from 'react-icons/fi';
import { CopyId, DataTable, DataTableColumn, PageHeader, SearchField, StatusChip, Tabs } from '../../../components/admin';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import Button from '../../../components/buttons/Button';
import PageLoading from '../../../components/page/PageLoading';
import PageMessage from '../../../components/page/PageMessage';
import HarvestSourceDrawer from '../../../components/admin/harvest/HarvestSourceDrawer';
import SourceRecordCard from '../../../components/admin/harvest/SourceRecordCard';
import {
  MODE_VARIANT,
  RECORD_STATUS_VARIANT,
  SYNC_STATE_VARIANT,
  describeSchedule,
  recordAuthors,
  recordTitle,
} from '../../../components/admin/harvest/harvestFormat';
import { useHarvestClient, useHarvestConnectors, useHarvestRecords, useHarvestSource } from '../../../hooks/api/harvest/useHarvest';
import { useInvalidateJobs, useJobs, useJobsClient } from '../../../hooks/api/jobs/useJobs';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { useCatalogTitles } from '../../../hooks/api/catalogs/useCatalogTitles';
import {
  DRY_RUN_RECORD_STATUSES,
  HarvestRecordStatus,
  IHarvestProbe,
  IHarvestRecord,
  IHarvestReport,
  IHarvestSourceDetail,
  IHarvestSourcePayload,
  RECORD_STATUSES,
  REPORT_COUNTERS,
} from '../../../utils/interfaces/harvest';
import { ACTIVE_JOB_STATES, IJob } from '../../../utils/interfaces/jobs';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';

const RECORDS_LIMIT = 25;

/** The PUT needs the required fields every time; whatever else is sent changes, the rest stays. */
const requiredFields = (s: IHarvestSourceDetail): IHarvestSourcePayload => ({
  slug: s.slug,
  name: s.name,
  adapter: s.adapter,
  system_key: s.system_key,
  target_catalog_id: s.target_catalog_id,
});

const JOB_STATE_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
  succeeded: 'success',
  failed: 'danger',
  blocked: 'warning',
  cancelled: 'neutral',
  cancelling: 'neutral',
  pending: 'info',
  queued: 'info',
  running: 'info',
};

const card = 'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800';
const cardTitle = 'flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100';

/** A probe's identify block, formats and sets come as OAI objects or (other connectors) plain values. */
const label = (item: Record<string, string | null> | string) =>
  typeof item === 'string' ? item : item.prefix ?? item.spec ?? item.name ?? JSON.stringify(item);

function Counters({ report }: { report: IHarvestReport }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {REPORT_COUNTERS.filter((key) => typeof report[key] === 'number').map((key) => {
        const value = report[key] as number;
        const alert = (key === 'ambiguous' || key === 'unmatched' || key === 'failed') && value > 0;
        return (
          <div
            key={key}
            className={`rounded-lg border px-3 py-2 ${
              alert ? 'border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10' : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t(`administration.harvest.counterLabel.${key}`)}</p>
            <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{value.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * One harvest source (#51): what it is, "Test connection", the MARC upload, dry run / run, the last run's counters
 * and every record with what the matcher decided. Dry run is the primary action; a real `create` run asks first.
 */
const AdminHarvestSource = () => {
  const { t } = useTranslation();
  const { 'source-id': id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuthContext();
  const { setEditingEntryTitle } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const api = useHarvestClient();
  const jobsApi = useJobsClient();
  const invalidateJobs = useInvalidateJobs();
  // Starting runs goes through `POST /api/v1/jobs`, which is superuser-only for now (IP-031).
  const canRun = !!auth?.isSuperUser;

  const { data: jobsData, refetch: refetchJob } = useJobs({ kind: 'harvest.run', subject_id: id, limit: 1 }, { enabled: !!id });
  const job: IJob | undefined = jobsData?.items[0];
  const running = !!job && ACTIVE_JOB_STATES.includes(job.state);

  const { data: source, isLoading, isError, error, refetch: refetchSource } = useHarvestSource(id, { poll: running ? 8000 : false });
  const { data: connectors = [] } = useHarvestConnectors();
  const { data: catalogs = [] } = useCatalogTitles();
  const connector = connectors.find((c) => c.name === source?.adapter);
  const catalogTitle = catalogs.find((c) => c.id === source?.target_catalog_id)?.title;

  const [editOpen, setEditOpen] = useState(false);
  const [probe, setProbe] = useState<IHarvestProbe | null>(null);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [confirmRun, setConfirmRun] = useState<{ full: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (source) setEditingEntryTitle(source.name);
  }, [source, setEditingEntryTitle]);

  // A run that just finished changed the counts and the records: refresh both.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running) refetchSource();
    wasRunning.current = running;
  }, [running, refetchSource]);

  // Records browser: dry-run rows or the mirror of real runs, one status tab at a time (URL-driven).
  const view: 'dry' | 'real' = (searchParams.get('view') as 'dry' | 'real') || (source?.last_report?.dry_run ? 'dry' : 'real');
  const counts = (view === 'dry' ? source?.dry_run_counts : source?.record_counts) ?? {};
  const order = view === 'dry' ? DRY_RUN_RECORD_STATUSES : RECORD_STATUSES;
  const firstWithRows = order.find((s) => (counts[s] ?? 0) > 0) ?? order[0];
  const status = (searchParams.get('status') as HarvestRecordStatus | null) ?? firstWithRows;
  const recordsPage = parseInt(searchParams.get('page') || '1', 10);
  const recordsQuery = searchParams.get('q') || '';

  const patch = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params, { replace: true });
  };

  const records = useHarvestRecords(
    id,
    { status: [status], dry_run: view === 'dry', query: recordsQuery || undefined, page: recordsPage, limit: RECORDS_LIMIT },
    !!source
  );

  const statusTabs = order.map((s) => ({ id: s, label: t(`administration.harvest.status.${s}`), count: counts[s] ?? 0 }));

  if (isLoading) return <PageLoading />;
  if (isError || !source) {
    const notFound = (error as any)?.response?.status === 404;
    return <PageMessage message={notFound ? t('administration.harvest.detail.notFound') : t('administration.harvest.detail.loadError')} />;
  }

  const saveFields = async (fields: Partial<IHarvestSourcePayload>, done: string) => {
    try {
      await api.update(source.id, { ...requiredFields(source), ...fields });
      toast.success(done);
    } catch (e) {
      toast.error(problemDetailMessage(e, t('administration.harvest.form.saveError')));
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      setProbe(await api.test(source.id));
    } catch (e) {
      setProbe({ identify: null, metadata_formats: [], sets: [], sample: null, errors: [problemDetailMessage(e, t('administration.harvest.test.error'))] });
    } finally {
      setTesting(false);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      await api.upload(source.id, file);
      toast.success(t('administration.harvest.upload.done', { name: file.name }));
    } catch (e: any) {
      const status = e?.response?.status;
      toast.error(
        status === 415
          ? t('administration.harvest.upload.notMarc')
          : status === 400
            ? t('administration.harvest.upload.empty')
            : status === 409
              ? t('administration.harvest.upload.noUploads')
              : problemDetailMessage(e, t('administration.harvest.upload.error'))
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const start = async (dryRun: boolean, full: boolean) => {
    setStarting(true);
    try {
      await jobsApi.apply({ kind: 'harvest.run', subject_id: source.id, spec: { dry_run: dryRun, full } });
      toast.success(dryRun ? t('administration.harvest.run.dryStarted') : t('administration.harvest.run.started'));
      // The records browser should show what this run is about to write.
      patch({ view: dryRun ? 'dry' : 'real', status: null, page: null });
      invalidateJobs();
      refetchJob();
    } catch (e) {
      toast.error(problemDetailMessage(e, t('administration.harvest.run.error')));
    } finally {
      setStarting(false);
      setConfirmRun(null);
    }
  };

  // A real run into a catalog in `create` mode adds books: confirm it, as a full run of any mode.
  const askRun = (full: boolean) => (source.mode === 'create' || full ? setConfirmRun({ full }) : start(false, full));

  const needsUploadFirst = !!connector?.needs_upload && !source.has_upload;
  const report = source.last_report;

  const fact = (term: string, value: ReactNode) => (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{term}</dt>
      <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  );

  const recordColumns: DataTableColumn<IHarvestRecord>[] = [
    {
      id: 'record',
      header: t('administration.harvest.records.record'),
      hideable: false,
      cell: (r) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-medium text-zinc-800 dark:text-zinc-100" title={recordTitle(r.source_record)}>
            {recordTitle(r.source_record) || <span className="italic text-zinc-400">{t('administration.harvest.record.untitled')}</span>}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{recordAuthors(r.source_record)}</p>
          <p className="truncate font-mono text-[11px] text-zinc-400">{r.record_id}</p>
        </div>
      ),
    },
    {
      id: 'isbn',
      header: 'ISBN',
      cell: (r) => <span className="font-mono text-xs">{r.source_record.identifiers?.isbn ?? '—'}</span>,
    },
    {
      id: 'status',
      header: t('administration.harvest.records.status'),
      cell: (r) => <StatusChip variant={RECORD_STATUS_VARIANT[r.status] ?? 'neutral'}>{t(`administration.harvest.status.${r.status}`)}</StatusChip>,
    },
    {
      id: 'matched_on',
      header: t('administration.harvest.records.matchedOn'),
      cell: (r) => (r.matched_on ? <code className="text-xs">{r.matched_on}</code> : <span className="text-zinc-400">—</span>),
    },
    {
      id: 'message',
      header: t('administration.harvest.records.message'),
      cell: (r) => <span className="line-clamp-2 max-w-xs text-xs text-zinc-600 dark:text-zinc-300">{r.message ?? '—'}</span>,
    },
    ...(source.mode === 'sync'
      ? ([
          {
            id: 'sync_state',
            header: t('administration.harvest.records.syncState'),
            cell: (r: IHarvestRecord) =>
              r.sync_state ? (
                <div>
                  <StatusChip variant={SYNC_STATE_VARIANT[r.sync_state] ?? 'neutral'}>{t(`administration.harvest.syncState.${r.sync_state}`)}</StatusChip>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{fmtDateTime(r.synced_at) ?? ''}</p>
                </div>
              ) : (
                <span className="text-zinc-400">—</span>
              ),
          },
          {
            id: 'versions',
            header: t('administration.harvest.records.versions'),
            defaultHidden: true,
            cell: (r: IHarvestRecord) => (
              <div className="text-[11px] text-zinc-500">
                <p>{t('administration.harvest.records.remoteVersion')}: {r.remote_version ?? '—'}</p>
                <p>{t('administration.harvest.records.localVersion')}: {fmtDateTime(r.local_version) ?? '—'}</p>
              </div>
            ),
          },
        ] as DataTableColumn<IHarvestRecord>[])
      : []),
    {
      id: 'entry',
      header: t('administration.harvest.records.entry'),
      align: 'right',
      cell: (r) =>
        r.entry_id ? (
          <Link
            to={NAVIGATION_PATHS.adminEditEntries + r.entry_id}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-primaryText hover:underline dark:text-primaryLight"
          >
            {t('administration.harvest.records.openEntry')}
          </Link>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={source.name}
        description={connector ? `${connector.title} → ${catalogTitle ?? '…'}` : undefined}
        meta={<CopyId value={source.id} label={t('administration.harvest.sourceId')} />}
        actions={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <FiEdit2 size={14} />
            {t('administration.harvest.detail.edit')}
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-5">
        {/* What this source is */}
        <section className={card} aria-label={t('administration.harvest.detail.summary')}>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {fact(t('administration.harvest.list.connector'), connector?.title ?? source.adapter)}
            {fact(
              t('administration.harvest.list.mode'),
              <StatusChip variant={MODE_VARIANT[source.mode] ?? 'neutral'}>{t(`administration.harvest.mode.${source.mode}`)}</StatusChip>
            )}
            {fact(t('administration.harvest.list.catalog'), catalogTitle ?? '—')}
            {fact(
              t('administration.harvest.list.enabled'),
              <StatusChip variant={source.enabled ? 'success' : 'neutral'}>
                {source.enabled ? t('administration.harvest.list.on') : t('administration.harvest.list.off')}
              </StatusChip>
            )}
            {fact(t('administration.harvest.list.schedule'), <span title={source.schedule || undefined}>{describeSchedule(source.schedule, t)}</span>)}
            {fact(t('administration.harvest.list.lastRun'), fmtDateTime(source.last_run_at) ?? t('administration.harvest.list.never'))}
          </dl>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {t('administration.harvest.detail.systemKey')}: <code>{source.system_key}</code>
            {source.base_url && (
              <>
                {' · '}
                <code className="break-all">{source.base_url}</code>
                {' · '}
                {source.metadata_prefix}
                {source.set_spec ? ` · ${source.set_spec}` : ''}
              </>
            )}
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Run */}
          <section className={card} aria-labelledby="harvest-run-title">
            <h2 id="harvest-run-title" className={cardTitle}>
              <FiPlay size={15} />
              {t('administration.harvest.run.title')}
            </h2>

            {connector?.needs_upload && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/40">
                <StatusChip variant={source.has_upload ? 'success' : 'warning'}>
                  {source.has_upload ? t('administration.harvest.upload.uploaded') : t('administration.harvest.upload.missing')}
                </StatusChip>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".mrc,.marc,.xml,.iso,application/marc,application/xml,text/xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <FiUploadCloud size={13} />
                  {uploading ? '…' : source.has_upload ? t('administration.harvest.upload.replace') : t('administration.harvest.upload.choose')}
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.upload.hint')}</span>
              </div>
            )}

            {canRun ? (
              <>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.run.hint')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => start(true, false)}
                    disabled={starting || running || needsUploadFirst}
                    className="flex items-center gap-2"
                  >
                    <FiZap size={15} />
                    {t('administration.harvest.run.dryRun')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => askRun(false)}
                    disabled={starting || running || !source.enabled || needsUploadFirst}
                    title={!source.enabled ? t('administration.harvest.run.needsEnabled') : undefined}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <FiPlay size={14} />
                    {t('administration.harvest.run.run')}
                  </button>
                  <button
                    type="button"
                    onClick={() => askRun(true)}
                    disabled={starting || running || !source.enabled || needsUploadFirst}
                    title={!source.enabled ? t('administration.harvest.run.needsEnabled') : t('administration.harvest.run.fullHint')}
                    className="rounded-md px-2 py-2 text-xs font-medium text-zinc-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                  >
                    {t('administration.harvest.run.full')}
                  </button>
                </div>
                {!source.enabled && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{t('administration.harvest.run.needsEnabled')}</p>}
                {needsUploadFirst && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{t('administration.harvest.upload.first')}</p>}
              </>
            ) : (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
                {t('administration.harvest.run.managerNote')}
              </p>
            )}

            {job && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <FiActivity size={13} />
                <span>{t('administration.harvest.run.lastJob')}</span>
                <StatusChip variant={JOB_STATE_VARIANT[job.state] ?? 'neutral'}>{t(`administration.jobs.state.${job.state}`, { defaultValue: job.state })}</StatusChip>
                {job.spec?.dry_run === true && <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] uppercase dark:bg-zinc-700">{t('administration.harvest.dryRunTag')}</span>}
                <span>{fmtDateTime(job.last_transition_at ?? job.updated_at)}</span>
                {job.reason && <span className="text-redText dark:text-red">{job.reason}</span>}
                <Link to={`${NAVIGATION_PATHS.adminJobs}?job=${job.id}`} className="font-medium text-primaryText hover:underline dark:text-primaryLight">
                  {t('administration.harvest.run.openJob')}
                </Link>
              </div>
            )}

            {report && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {report.dry_run ? t('administration.harvest.run.lastDryReport') : t('administration.harvest.run.lastReport')}
                  {report.full ? ` · ${t('administration.harvest.run.full')}` : ''}
                  {report.finished_at ? ` · ${fmtDateTime(report.finished_at)}` : ''}
                </p>
                <Counters report={report} />
              </div>
            )}
          </section>

          {/* Test connection */}
          <section className={card} aria-labelledby="harvest-test-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="harvest-test-title" className={cardTitle}>
                <FiWifi size={15} />
                {t('administration.harvest.test.title')}
              </h2>
              <button
                type="button"
                onClick={runTest}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {testing ? t('administration.harvest.test.testing') : t('administration.harvest.test.run')}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.test.hint')}</p>

            {probe && (
              <div className="mt-3 flex flex-col gap-3">
                {probe.errors.length > 0 && (
                  <div role="alert" className="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-sm text-redText dark:text-red">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <FiAlertTriangle size={14} />
                      {t('administration.harvest.test.errors', { count: probe.errors.length })}
                    </p>
                    <ul className="mt-1 list-disc pl-5">
                      {probe.errors.map((e, i) => (
                        <li key={i} className="break-words">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {probe.errors.length === 0 && (
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('administration.harvest.test.ok')}</p>
                )}

                {probe.identify && (
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t('administration.harvest.test.identify')}</p>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                      {Object.entries(probe.identify).map(([k, v]) => (
                        <div key={k} className="flex min-w-0 gap-1.5">
                          <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{k}:</dt>
                          <dd className="min-w-0 break-all text-zinc-800 dark:text-zinc-100">{v == null ? '—' : String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {probe.metadata_formats.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t('administration.harvest.test.formats')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {probe.metadata_formats.map((f, i) => {
                        const prefix = label(f);
                        const current = prefix === source.metadata_prefix;
                        return (
                          <button
                            key={`${prefix}-${i}`}
                            type="button"
                            disabled={current || !source.base_url}
                            onClick={() => saveFields({ metadata_prefix: prefix }, t('administration.harvest.test.prefixSet', { prefix }))}
                            title={current ? t('administration.harvest.test.inUse') : t('administration.harvest.test.useFormat')}
                            className={`rounded-full border px-2 py-0.5 font-mono text-xs ${
                              current
                                ? 'border-primary bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {prefix}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {probe.sets.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t('administration.harvest.test.sets')}</p>
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                      {probe.sets.map((s, i) => {
                        const spec = typeof s === 'string' ? s : s.spec ?? '';
                        const name = typeof s === 'string' ? s : s.name ?? spec;
                        const current = spec === (source.set_spec ?? '');
                        return (
                          <button
                            key={`${spec}-${i}`}
                            type="button"
                            disabled={current || !spec || !source.base_url}
                            onClick={() => saveFields({ set_spec: spec }, t('administration.harvest.test.setSet', { set: name }))}
                            title={spec}
                            className={`rounded-full border px-2 py-0.5 text-xs ${
                              current
                                ? 'border-primary bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    {source.set_spec && source.base_url && (
                      <button
                        type="button"
                        onClick={() => saveFields({ set_spec: null }, t('administration.harvest.test.setCleared'))}
                        className="mt-1 text-xs text-zinc-500 hover:underline"
                      >
                        {t('administration.harvest.test.clearSet')}
                      </button>
                    )}
                  </div>
                )}

                {probe.sample && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t('administration.harvest.test.sample')}</p>
                    <SourceRecordCard record={probe.sample} />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Records */}
        <section aria-labelledby="harvest-records-title">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="harvest-records-title" className="text-lg font-semibold text-secondary dark:text-secondaryLight">
              {t('administration.harvest.records.title')}
            </h2>
            <div role="radiogroup" aria-label={t('administration.harvest.records.which')} className="inline-flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-600">
              {(['dry', 'real'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => patch({ view: v, status: null, page: null })}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    view === v ? 'bg-primary text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {v === 'dry' ? t('administration.harvest.records.lastDryRun') : t('administration.harvest.records.real')}
                </button>
              ))}
            </div>
          </div>
          <Tabs
            tabs={statusTabs}
            active={status}
            onChange={(s) => patch({ status: s, page: null })}
            label={t('administration.harvest.records.byStatus')}
            className="mb-2"
          />
          <DataTable<IHarvestRecord>
            caption={t('administration.harvest.records.title')}
            columns={recordColumns}
            rows={records.data?.items ?? []}
            getRowId={(r) => r.id}
            onRowClick={(r) => (r.entry_id ? navigate(NAVIGATION_PATHS.adminEditEntries + r.entry_id) : undefined)}
            loading={records.isLoading}
            error={records.isError ? t('administration.harvest.records.loadError') : undefined}
            onRetry={() => records.refetch()}
            emptyTitle={view === 'dry' ? t('administration.harvest.records.emptyDry') : t('administration.harvest.records.empty')}
            page={records.data?.metadata.page ?? 1}
            pageCount={records.data?.metadata.pages ?? 1}
            total={records.data?.metadata.total ?? 0}
            pageSize={RECORDS_LIMIT}
            onPageChange={(p) => patch({ page: String(p) })}
            storageKey="admin-harvest-records"
            density="compact"
            toolbar={
              <SearchField
                value={recordsQuery}
                onChange={(v) => patch({ q: v || null, page: null })}
                label={t('administration.harvest.records.search')}
                placeholder={t('administration.harvest.records.search')}
                className="max-w-sm"
              />
            }
          />
        </section>
      </div>

      <HarvestSourceDrawer
        open={editOpen}
        source={source}
        onClose={() => setEditOpen(false)}
        onSaved={() => refetchSource()}
        onDeleted={() => navigate(NAVIGATION_PATHS.adminHarvest, { replace: true })}
      />

      <ConfirmDialog
        open={confirmRun !== null}
        title={confirmRun?.full ? t('administration.harvest.run.confirmFullTitle') : t('administration.harvest.run.confirmTitle')}
        message={t(source.mode === 'create' ? 'administration.harvest.run.confirmCreate' : 'administration.harvest.run.confirmFull', {
          name: source.name,
          catalog: catalogTitle ?? '',
        })}
        confirmLabel={confirmRun?.full ? t('administration.harvest.run.full') : t('administration.harvest.run.run')}
        cancelLabel={t('administration.harvest.form.cancel')}
        loading={starting}
        onConfirm={() => start(false, !!confirmRun?.full)}
        onCancel={() => setConfirmRun(null)}
      />
    </div>
  );
};

export default AdminHarvestSource;
