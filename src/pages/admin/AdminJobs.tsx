import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, StatusChip, Tabs } from '../../components/admin';
import EncryptionJobsTable from '../../components/admin/jobs/EncryptionJobsTable';
import ExtractionJobsTable from '../../components/admin/jobs/ExtractionJobsTable';
import { JobsNote, OcrUnavailable } from '../../components/admin/jobs/jobsUi';
import useAdminStatistics from '../../hooks/api/statistics/useAdminStatistics';

type JobsTab = 'lcp' | 'ai' | 'ocr';
const TABS: JobsTab[] = ['lcp', 'ai', 'ocr'];

/** Point-in-time LCP health from `/statistics` — the only catalog-wide job counts the API serves. */
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
 * Background jobs the catalog runs per publication — Readium LCP encryption, AI processing
 * (IP-018) and OCR — with their state and shortcuts to start them again.
 */
const AdminJobs = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab') as JobsTab | null;
  const tab: JobsTab = raw && TABS.includes(raw) ? raw : 'lcp';

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.jobs.title')} description={t('administration.jobs.description')} />

      <Tabs
        label={t('administration.jobs.title')}
        active={tab}
        // Each tab has its own search, filter, sort and page — start it clean.
        onChange={(id) => setSearchParams(id === 'lcp' ? {} : { tab: id })}
        tabs={TABS.map((id) => ({ id, label: t(`administration.jobs.tabs.${id}`) }))}
      />

      <div className="mt-3">
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
        {tab === 'ocr' && <OcrUnavailable />}
      </div>
    </div>
  );
};

export default AdminJobs;
