import { useTranslation } from 'react-i18next';
import StatusChip, { StatusVariant } from '../StatusChip';
import { IJob, IJobKind, JobRunStatus, JobState } from '../../../utils/interfaces/jobs';

const STATE_VARIANT: Record<JobState, StatusVariant> = {
  pending: 'info',
  queued: 'info',
  running: 'info',
  blocked: 'warning',
  cancelling: 'neutral',
  cancelled: 'neutral',
  succeeded: 'success',
  failed: 'danger',
};

const RUN_VARIANT: Record<JobRunStatus, StatusVariant> = {
  queued: 'info',
  received: 'info',
  started: 'info',
  retrying: 'warning',
  succeeded: 'success',
  failed: 'danger',
  rejected: 'danger',
  lost: 'danger',
  revoked: 'neutral',
};

/** A job's observed state; a job queued past the stale limit says so instead of "Queued". */
export function JobStateChip({ job, className }: { job: Pick<IJob, 'state' | 'stale'>; className?: string }) {
  const { t } = useTranslation();
  if (job.stale && job.state === 'queued') {
    return (
      <StatusChip variant="warning" className={className} title={t('administration.jobs.all.staleHint')}>
        {t('administration.jobs.all.stale')}
      </StatusChip>
    );
  }
  return (
    <StatusChip variant={STATE_VARIANT[job.state] ?? 'neutral'} className={className}>
      {t(`administration.jobs.state.${job.state}`, { defaultValue: job.state })}
    </StatusChip>
  );
}

export function RunStatusChip({ status, className }: { status: JobRunStatus; className?: string }) {
  const { t } = useTranslation();
  return (
    <StatusChip variant={RUN_VARIANT[status] ?? 'neutral'} className={className}>
      {t(`administration.jobs.runStatus.${status}`, { defaultValue: status })}
    </StatusChip>
  );
}

/**
 * The kind's name: the portal's translation where it has one (keys nest by the kind's dots,
 * `extraction.run` → `kinds.extraction.run`), else the catalog's English title, else the kind.
 */
export function useKindLabel(kinds: IJobKind[] | undefined) {
  const { t } = useTranslation();
  return (kind: string) =>
    t(`administration.jobs.kinds.${kind}`, { defaultValue: kinds?.find((k) => k.kind === kind)?.title ?? kind });
}

/** `evilflowers_text_worker.paragraphs` → "Paragraphs" (the step), with the service as a hint. */
export function useTaskLabel() {
  const { t } = useTranslation();
  return (name: string) => {
    const dot = name.lastIndexOf('.');
    const step = dot >= 0 ? name.slice(dot + 1) : name;
    return t(`administration.extraction.jobs.${step}`, { defaultValue: step.replace(/_/g, ' ') });
  };
}

/**
 * A run's name: the step its Celery task does ("Analysis", "Paragraphs") when the portal names that step —
 * never the job type's name, so a run doesn't read like its type — else the type's name for a type's own task
 * (maintenance), else the task's last segment.
 */
export function useRunLabel(kinds: IJobKind[] | undefined) {
  const { t, i18n } = useTranslation();
  const kindLabel = useKindLabel(kinds);
  const taskLabel = useTaskLabel();
  return (run: { name: string; kind: string | null }) => {
    if (run.name === 'unknown') return t('administration.jobs.log.unknownTask');
    const step = run.name.slice(run.name.lastIndexOf('.') + 1);
    if (i18n.exists(`administration.extraction.jobs.${step}`)) return taskLabel(run.name);
    const kind = run.kind ? kinds?.find((k) => k.kind === run.kind) : undefined;
    return kind && kind.task === run.name ? kindLabel(kind.kind) : taskLabel(run.name);
  };
}

export type KindGroup = 'publication' | 'scheduled' | 'log';

/** Publication work (has a subject), scheduled maintenance (keyed, no subject), or recorded-only. */
export const kindGroup = (kind: IJobKind): KindGroup => (!kind.keyed ? 'log' : kind.subject_type ? 'publication' : 'scheduled');

export const fmtRuntime = (seconds: number | null | undefined): string | null => {
  if (seconds == null) return null;
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 90) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
};

/** Small uppercase heading of a drawer section. */
export const sectionTitle = 'mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400';
