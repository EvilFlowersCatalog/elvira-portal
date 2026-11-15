import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, StatusChip } from '../../components/admin';
import EncryptionJobsTable from '../../components/admin/jobs/EncryptionJobsTable';
import ExtractionJobsTable from '../../components/admin/jobs/ExtractionJobsTable';
import JobsOverview from '../../components/admin/jobs/JobsOverview';
import JobsTable from '../../components/admin/jobs/JobsTable';
import JobsTrail, { PUBLICATION_TABLE_KINDS } from '../../components/admin/jobs/JobsTrail';
import TaskLog from '../../components/admin/jobs/TaskLog';
import { JobsNote } from '../../components/admin/jobs/jobsUi';
import useAdminStatistics from '../../hooks/api/statistics/useAdminStatistics';

type View = 'overview' | 'jobs' | 'runs' | 'publications';

/** Old `?tab=` links (dashboard, bookmarks, the assistant's guide) → the view that replaced each tab. */
const LEGACY_TABS: Record<string, Record<string, string>> = {
  all: { view: 'jobs' },
  lcp: { view: 'publications', kind: 'readium.encrypt' },
  ai: { view: 'publications', kind: 'extraction.run' },
  ocr: { kind: 'files.ocr', state: 'all' },
  scheduled: {},
  log: { view: 'runs' },
};

/** Point-in-time LCP health from `/statistics` (lendability included, which job states alone don't say). */
const LcpHealth = () => {
  const { t } = useTranslation();
  const { data } = useAdminStatistics('7d');
  if (data?.status !== 'live' && data?.status !== 'demo') return null;
  const a = data.data.attention;
  const tiles = [
    { key: 'encryption_failed', value: a.encryption_failed, variant: 'danger' as const },
    { key: 'encryption_stuck', value: a.encryption_stuck, variant: 'warning' as const },
    { key: 'lcp_not_lendable', value: a.lcp_not_lendable, variant: 'neutral' as const },
  ];
  return (
    <div className="mx-5 mb-3 flex flex-wrap items-center gap-2 text-sm">
      {tiles.map((tile) => (
        <StatusChip key={tile.key} variant={tile.value > 0 ? tile.variant : 'success'}>
          <span className="tabular-nums font-semibold">{tile.value}</span>&nbsp;{t(`administration.jobs.lcp.health.${tile.key}`, { count: tile.value })}
        </StatusChip>
      ))}
      {data.status === 'demo' && <span className="text-xs text-zinc-400">{t('administration.jobs.lcp.healthDemo')}</span>}
    </div>
  );
};

/**
 * Background jobs, in three levels: job TYPES (what the catalog knows how to do — the overview), JOBS
 * (one per file or publication, with its current state) and RUNS (each execution on a worker). The view
 * lives in the URL — `?kind=` a type's jobs, `?view=runs` the run log, `?view=publications` the older
 * per-publication tables that also start never-processed work — and `?job=` opens one job on any view.
 */
const AdminJobs = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const legacy = searchParams.get('tab');
  const kind = searchParams.get('kind') ?? undefined;
  const raw = searchParams.get('view');
  const view: View =
    raw === 'jobs' || raw === 'runs' || raw === 'publications'
      ? raw
      : kind || searchParams.get('state')
        ? 'jobs'
        : 'overview';

  useEffect(() => {
    if (legacy && legacy in LEGACY_TABS) setSearchParams(LEGACY_TABS[legacy], { replace: true });
  }, [legacy, setSearchParams]);

  const publicationsKind = view === 'publications' && kind && PUBLICATION_TABLE_KINDS.includes(kind) ? kind : null;

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.jobs.title')} description={view === 'overview' ? t('administration.jobs.description') : undefined} />

      {view === 'overview' && <JobsOverview />}

      {view === 'jobs' && (
        <>
          <JobsTrail kind={kind} view="jobs" />
          {/* A type's view is that type only; the kind filter belongs to the unfiltered list. */}
          <JobsTable key={kind ?? 'all'} fixedKind={kind} />
        </>
      )}

      {view === 'runs' && (
        <>
          <JobsTrail kind={kind} view="runs" />
          <TaskLog kind={kind} />
        </>
      )}

      {view === 'publications' &&
        (publicationsKind ? (
          <>
            <JobsTrail kind={publicationsKind} view="publications" />
            {publicationsKind === 'readium.encrypt' ? (
              <>
                <LcpHealth />
                <JobsNote>{t('administration.jobs.lcp.note')}</JobsNote>
                <EncryptionJobsTable />
              </>
            ) : (
              <>
                <JobsNote>{t('administration.jobs.ai.note')}</JobsNote>
                <ExtractionJobsTable />
              </>
            )}
          </>
        ) : (
          <JobsOverview />
        ))}
    </div>
  );
};

export default AdminJobs;
