import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import Drawer from '../Drawer';
import { useJob, useJobKinds } from '../../../hooks/api/jobs/useJobs';
import useEntriesByIds from '../../../hooks/api/entries/useEntriesByIds';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import JobDetail from './JobDetail';
import { useKindLabel } from './jobModel';

/**
 * A job in a side drawer. Opening a related job (the publication's OCR, its post-processing …)
 * stays in the drawer with a way back, so following a chain never loses the list behind it.
 */
export default function JobDrawer({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [stack, setStack] = useState<string[]>([]);
  useEffect(() => setStack(jobId ? [jobId] : []), [jobId]);

  const current = stack[stack.length - 1] ?? null;
  const { data: job } = useJob(current);
  const { data: kinds } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const { data: entries } = useEntriesByIds(job?.entry_id ? [job.entry_id] : []);
  const entry = entries?.[0];

  return (
    <Drawer
      open={!!current}
      onClose={onClose}
      // Names its level: this is one job (an instance) of the type, not the type itself.
      title={job ? t('administration.jobs.detail.jobOf', { kind: kindLabel(job.kind) }) : t('administration.jobs.detail.title')}
      description={entry?.title ?? (job && !job.entry_id ? t('administration.jobs.all.noPublication') : undefined)}
      width="max-w-2xl"
      footer={
        <div className="flex w-full items-center gap-3">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={() => setStack((s) => s.slice(0, -1))}
              className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
            >
              <FiArrowLeft size={13} /> {t('administration.jobs.detail.back')}
            </button>
          )}
          {job?.entry_id && (
            <Link
              to={`${NAVIGATION_PATHS.adminEditEntries}${job.entry_id}?tab=jobs`}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight"
            >
              {t('administration.jobs.openPublication')} <FiExternalLink size={13} />
            </Link>
          )}
        </div>
      }
    >
      {current && <JobDetail key={current} jobId={current} onOpenJob={(id) => setStack((s) => [...s, id])} />}
    </Drawer>
  );
}
