import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiCpu } from 'react-icons/fi';
import { useEntryExtraction } from '../../../hooks/api/entries/useEntryExtraction';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { ExtractionStatusChip } from '../../specific-page/admin-entry-page/extraction/EntryExtractionPanel';
import EntryEncryptionCard from './EntryEncryptionCard';
import { jobCard, jobTitle, OcrUnavailable } from './jobsUi';

/** AI processing at a glance; the full view and its controls are the "AI processing" tab. */
const ExtractionSummary = ({ entryId, onOpenAi }: { entryId: string; onOpenAi: () => void }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useEntryExtraction(entryId);
  const runs = data?.acquisitions.flatMap((a) => a.runs) ?? [];
  const latest = runs.find((r) => r.is_active) ?? runs[0];

  return (
    <section className={jobCard}>
      <div className="flex flex-wrap items-center gap-2">
        <FiCpu className="text-zinc-400" />
        <h2 className={jobTitle}>{t('administration.jobs.ai.cardTitle')}</h2>
        {data && <ExtractionStatusChip status={data.status} />}
        <button
          type="button"
          onClick={onOpenAi}
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight"
        >
          {t('administration.jobs.ai.openTab')} <FiArrowRight size={13} />
        </button>
      </div>
      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-400">…</p>
      ) : data ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {/* The AI tab's failed text points at its run history "below"; here it is one click away. */}
          {data.status === 'failed' ? t('administration.jobs.ai.failedHelp') : t(`administration.extraction.statusHelp.${data.status}`)}
          {latest && ` ${t('administration.jobs.ai.lastRun', { date: fmtDateTime(latest.finished_at ?? latest.created_at) })}`}
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">{t('administration.extraction.loadError')}</p>
      )}
    </section>
  );
};

/** Every background job of one publication, with shortcuts to start it again. */
export default function EntryJobsPanel({ entryId, title, onOpenAi }: { entryId: string; title: string; onOpenAi: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <EntryEncryptionCard entryId={entryId} title={title} />
      <ExtractionSummary entryId={entryId} onOpenAi={onOpenAi} />
      <OcrUnavailable compact />
    </div>
  );
}
