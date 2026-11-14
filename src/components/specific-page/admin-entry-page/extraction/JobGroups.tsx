import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { IExtractionRun } from '../../../../utils/interfaces/extraction';
import { groupStatus, jobGroups } from '../../../../utils/func/extractionJobs';
import { StatusChip } from '../../../admin';

const BAR: Record<'done' | 'failed', string> = {
  done: 'bg-greenText dark:bg-green',
  failed: 'bg-redText dark:bg-red',
};

/**
 * A run's jobs, one row per kind (figures, equations …) with done / pending / failed counts,
 * a progress bar and the page range still pending — a run of ~350 batch jobs reads like an
 * unbatched one (elvira-portal#42).
 */
export default function JobGroups({ run, compact }: { run: Pick<IExtractionRun, 'jobs' | 'job_groups'>; compact?: boolean }) {
  const { t } = useTranslation();
  const groups = jobGroups(run);
  if (!groups.length) return null;

  return (
    <ul aria-label={t('administration.extraction.jobGroups.label')} className={twMerge('flex flex-col', compact ? 'gap-1' : 'gap-1.5')}>
      {groups.map((group) => {
        const status = groupStatus(group);
        const label = t(`administration.extraction.jobs.${group.kind}`, { defaultValue: group.kind });
        return (
          <li key={group.kind} className="grid grid-cols-[7rem_minmax(4rem,10rem)_1fr] items-center gap-x-3 gap-y-0.5 text-xs">
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-200" title={group.kind}>
              {label}
            </span>
            {/* Done and failed as segments of one bar; the rest of the track is what still pends. */}
            <span
              className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={group.total}
              aria-valuenow={group.done}
            >
              <span className={BAR.done} style={{ width: `${(group.done / group.total) * 100}%` }} />
              {group.failed > 0 && <span className={BAR.failed} style={{ width: `${(group.failed / group.total) * 100}%` }} />}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums text-zinc-500 dark:text-zinc-400">
              {status === 'done' ? (
                <StatusChip variant="success" className="px-1.5 py-0 text-[10px]">
                  {t('administration.extraction.status.done')}
                  {group.total > 1 && ` · ${group.total}`}
                </StatusChip>
              ) : (
                <span>{t('administration.extraction.jobGroups.progress', { done: group.done, total: group.total })}</span>
              )}
              {group.pending > 0 && (
                <span>
                  {t('administration.extraction.jobGroups.pending', { count: group.pending })}
                  {group.pending_pages &&
                    ` (${t('administration.extraction.jobGroups.pages', { from: group.pending_pages[0], to: group.pending_pages[1] })})`}
                </span>
              )}
              {group.failed > 0 && (
                <span className="font-medium text-redText dark:text-red">
                  {t('administration.extraction.jobGroups.failed', { count: group.failed })}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
