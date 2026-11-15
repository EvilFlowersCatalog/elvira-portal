import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, StatusChip, Tabs } from '../../components/admin';
import EncryptionJobsTable from '../../components/admin/jobs/EncryptionJobsTable';
import ExtractionJobsTable from '../../components/admin/jobs/ExtractionJobsTable';
import JobsTable from '../../components/admin/jobs/JobsTable';
import ScheduledJobs from '../../components/admin/jobs/ScheduledJobs';
import TaskLog from '../../components/admin/jobs/TaskLog';
import { JobsNote } from '../../components/admin/jobs/jobsUi';
import useAdminStatistics from '../../hooks/api/statistics/useAdminStatistics';
import { useJobSummary } from '../../hooks/api/jobs/useJobs';

type JobsTab = 'all' | 'lcp' | 'ai' | 'scheduled' | 'log';
const TABS: JobsTab[] = ['all', 'lcp', 'ai', 'scheduled', 'log'];

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
 * Background jobs: every job the catalog tracks (state, tasks, history, retry / cancel), the two
 * publication pipelines with their bulk tools (LCP, AI — they also start what never ran), the
 * scheduled maintenance tasks and the raw task log for debugging.
 */
const AdminJobs = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: JobsTab = raw && (TABS as string[]).includes(raw) ? (raw as JobsTab) : 'all';
  const { data: summary } = useJobSummary();
  const failed = summary?.reduce((n, row) => n + (row.states.failed ?? 0), 0);

  // The OCR tab became a kind of the unified list (files.ocr); keep old links working.
  useEffect(() => {
    if (raw === 'ocr') setSearchParams({ tab: 'all', kind: 'files.ocr', state: 'all' }, { replace: true });
  }, [raw, setSearchParams]);

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.jobs.title')} description={t('administration.jobs.description')} />

      <div data-guide="jobs-tabs">
        <Tabs
          label={t('administration.jobs.title')}
          active={tab}
          // Each tab has its own search, filter, sort and page — start it clean.
          onChange={(id) => setSearchParams(id === 'all' ? {} : { tab: id })}
          tabs={TABS.map((id) => ({ id, label: t(`administration.jobs.tabs.${id}`), count: id === 'all' && failed ? failed : null }))}
        />
      </div>

      <div className="mt-3">
        {tab === 'all' && <JobsTable />}
        {tab === 'lcp' && (
          <>
            <LcpHealth />
            <JobsNote>{t('administration.jobs.lcp.note')}</JobsNote>
            <EncryptionJobsTable />
          </>
        )}
        {tab === 'ai' && (
          <>
            <JobsNote>{t('administration.jobs.ai.note')}</JobsNote>
            <ExtractionJobsTable />
          </>
        )}
        {tab === 'scheduled' && <ScheduledJobs />}
        {tab === 'log' && <TaskLog />}
      </div>
    </div>
  );
};

export default AdminJobs;
