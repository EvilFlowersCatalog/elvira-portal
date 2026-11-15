import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import { FiChevronRight, FiPlay, FiRefreshCw, FiRotateCw, FiSquare } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { useJob, useJobKinds, useJobRuns, useJobs } from '../../../hooks/api/jobs/useJobs';
import { ACTIVE_JOB_STATES, IJob, IJobDetail, IJobRun, JobStepCounts } from '../../../utils/interfaces/jobs';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { bulkBtn, bulkBtnDanger } from '../BulkBar';
import CopyId, { CopyButton } from '../CopyId';
import JobActionDialog, { JobDialogAction } from './JobActionDialog';
import { fmtRuntime, JobStateChip, RunStatusChip, sectionTitle, useKindLabel, useRunLabel } from './jobModel';

const BAR = { done: 'bg-greenText dark:bg-green', failed: 'bg-redText dark:bg-red' };

/** The extraction run's steps (figures, tables, equations, paragraphs) with done / pending / failed. */
function Steps({ jobs, runFailed }: { jobs: Record<string, JobStepCounts>; runFailed: boolean }) {
  const { t } = useTranslation();
  const rows = Object.entries(jobs).sort(([a], [b]) => a.localeCompare(b));
  // A stale-failed run has steps left pending, not failed: the note applies to both.
  const anyFailed = runFailed || rows.some(([, c]) => (c.failed ?? 0) > 0);
  return (
    <section>
      <h3 className={sectionTitle}>{t('administration.jobs.detail.steps')}</h3>
      <ul className="flex flex-col gap-1.5">
        {rows.map(([step, c]) => {
          const done = c.done ?? 0;
          const failed = c.failed ?? 0;
          const pending = c.pending ?? 0;
          const total = done + failed + pending || 1;
          return (
            <li key={step} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-xs">
              <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                {t(`administration.extraction.jobs.${step}`, { defaultValue: step })}
              </span>
              <span className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700" aria-hidden>
                <span className={BAR.done} style={{ width: `${(done / total) * 100}%` }} />
                {failed > 0 && <span className={BAR.failed} style={{ width: `${(failed / total) * 100}%` }} />}
              </span>
              <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                {failed > 0 ? (
                  <span className="font-medium text-redText dark:text-red">{t('administration.jobs.detail.stepFailed', { count: failed })}</span>
                ) : pending > 0 ? (
                  t('administration.jobs.detail.stepProgress', { done, total })
                ) : (
                  t('administration.jobs.state.succeeded')
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {/* Honest about the backend: there is no per-step dispatch, a retry re-runs the whole file. */}
      {anyFailed && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.jobs.detail.stepRetryNote')}</p>}
    </section>
  );
}

/** One Celery task: step, status, timing, worker; the task id to copy and the error to read. */
function RunRow({ run, child }: { run: IJobRun; child?: boolean }) {
  const { t } = useTranslation();
  const { data: kinds } = useJobKinds();
  const runLabel = useRunLabel(kinds);
  const when = run.finished_at ?? run.started_at ?? run.sent_at ?? run.created_at;
  return (
    <li className={twMerge('border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-700/60', child && 'pl-4')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {child && <FiChevronRight size={12} className="text-zinc-300 dark:text-zinc-600" aria-hidden />}
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100" title={run.name}>
          {runLabel(run)}
        </span>
        <RunStatusChip status={run.status} className="px-2 py-0 text-[11px]" />
        {run.attempts > 1 && <span className="text-[11px] text-zinc-400">{t('administration.jobs.detail.attempts', { count: run.attempts })}</span>}
        <span className="ml-auto text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
          {[fmtRuntime(run.runtime), fmtDateTime(when)].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-zinc-400">
        <CopyId value={run.id} short label={t('administration.jobs.detail.copyTaskId')} />
        {run.worker && (
          <span className="truncate" title={run.worker}>
            {run.worker.split('@').pop()}
          </span>
        )}
        {run.trace_id && (
          <span className="inline-flex items-center gap-1">
            {t('administration.jobs.detail.trace')}
            <CopyId value={run.trace_id} short label={t('administration.jobs.detail.copyTraceId')} />
          </span>
        )}
      </div>
      {run.error && (
        <details className="mt-1 group">
          <summary className="cursor-pointer truncate text-xs text-redText marker:text-zinc-400 dark:text-red">{run.error.split('\n')[0]}</summary>
          <div className="relative mt-1">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-red/10 p-2 pr-8 text-[11px] text-redText dark:text-red">{run.error}</pre>
            <CopyButton text={run.error} label={t('administration.jobs.detail.copyError')} className="absolute right-1 top-1" />
          </div>
        </details>
      )}
    </li>
  );
}

/** The job's own runs with the follow-up tasks they sent nested under them, newest first. */
function Tasks({ jobId, active }: { jobId: string; active: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useJobRuns({ job_id: jobId, limit: 50 }, { poll: active });
  const runs = useMemo(() => data?.items ?? [], [data]);
  const tree = useMemo(() => {
    const ids = new Set(runs.map((r) => r.id));
    const roots = runs.filter((r) => !r.parent_id || !ids.has(r.parent_id));
    const children = (id: string) => runs.filter((r) => r.parent_id === id);
    return roots.map((root) => ({ root, children: children(root.id) }));
  }, [runs]);

  return (
    <section>
      <h3 className={sectionTitle}>
        {t('administration.jobs.detail.tasks')}
        {data && data.metadata.total > runs.length && (
          <span className="ml-1 normal-case tracking-normal text-zinc-400">{t('administration.jobs.detail.tasksShown', { shown: runs.length, total: data.metadata.total })}</span>
        )}
      </h3>
      {isLoading ? (
        <p className="text-xs text-zinc-400">…</p>
      ) : runs.length === 0 ? (
        <p className="text-xs text-zinc-500">{t('administration.jobs.detail.noTasks')}</p>
      ) : (
        <ul className="rounded-lg border border-zinc-200 px-3 dark:border-zinc-700">
          {tree.map(({ root, children }) => (
            <li key={root.id} className="list-none">
              <ul>
                <RunRow run={root} />
                {children.map((c) => (
                  <RunRow key={c.id} run={c} child />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The publication's other jobs (OCR, encryption, post-processing, summaries …): each runs on its own. */
function Related({ job, onOpen }: { job: IJobDetail; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const { data: kinds } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const { data } = useJobs({ entry_id: job.entry_id ?? undefined, limit: 50 }, { enabled: !!job.entry_id, poll: false });
  const others = [
    ...(data?.items ?? []).filter((j) => j.id !== job.id),
    ...job.consequences.filter((c) => !data?.items.some((j) => j.id === c.id)),
  ];
  if (!others.length) return null;
  return (
    <section>
      <h3 className={sectionTitle}>{t('administration.jobs.detail.related')}</h3>
      <ul className="flex flex-col divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-700/60 dark:border-zinc-700">
        {others.map((other: IJob) => (
          <li key={other.id}>
            <button
              type="button"
              onClick={() => onOpen(other.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
            >
              <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-100">{kindLabel(other.kind)}</span>
              {other.cause_id === job.id && <span className="text-[11px] text-zinc-400">{t('administration.jobs.detail.followUp')}</span>}
              <JobStateChip job={other} className="px-2 py-0 text-[11px]" />
              <FiChevronRight size={14} className="text-zinc-400" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const Disclosure = ({ title, children }: { title: string; children: ReactNode }) => (
  <details className="group rounded-lg border border-zinc-200 dark:border-zinc-700">
    <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      <FiChevronRight size={13} className="transition-transform group-open:rotate-90" aria-hidden />
      {title}
    </summary>
    <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">{children}</div>
  </details>
);

function Timeline({ job }: { job: IJobDetail }) {
  const { t } = useTranslation();
  if (!job.events.length) return null;
  return (
    <Disclosure title={t('administration.jobs.detail.timeline', { count: job.events.length })}>
      <ol className="flex flex-col gap-1 text-xs">
        {[...job.events].reverse().map((event, i) => {
          const data = Object.entries(event.data)
            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join(', ');
          return (
            <li key={i} className="grid grid-cols-[7.5rem_1fr] gap-2">
              <span className="tabular-nums text-zinc-400">{fmtDateTime(event.timestamp)}</span>
              <span className="min-w-0 text-zinc-700 dark:text-zinc-200">
                <span className="font-mono text-[11px]">{event.type.replace(/^job:/, '')}</span>
                {data && <span className="ml-1.5 break-all text-zinc-400">{data}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </Disclosure>
  );
}

/** Everything a developer pastes into a log query or a bug report, out of the way until asked for. */
function Technical({ job }: { job: IJobDetail }) {
  const { t } = useTranslation();
  const rows: [string, ReactNode][] = [
    [t('administration.jobs.detail.ids.job'), <CopyId key="job" value={job.id} />],
    [t('administration.jobs.detail.ids.kind'), <CopyId key="kind" value={job.kind} />],
    job.subject_id && [job.subject_type ?? t('administration.jobs.detail.ids.subject'), <CopyId key="subject" value={job.subject_id} />],
    job.entry_id && [t('administration.jobs.detail.ids.entry'), <CopyId key="entry" value={job.entry_id} />],
    job.catalog_id && [t('administration.jobs.detail.ids.catalog'), <CopyId key="catalog" value={job.catalog_id} />],
    job.current_run && [t('administration.jobs.detail.ids.task'), <CopyId key="task" value={job.current_run.id} />],
    job.current_run?.trace_id && [t('administration.jobs.detail.ids.trace'), <CopyId key="trace" value={job.current_run.trace_id} />],
    job.detail.extraction_run && [t('administration.jobs.detail.ids.extractionRun'), <CopyId key="run" value={job.detail.extraction_run.id} />],
    job.cause_id && [t('administration.jobs.detail.ids.cause'), <CopyId key="cause" value={job.cause_id} />],
    [
      t('administration.jobs.detail.ids.generation'),
      <span key="gen" className="font-mono text-[11px] text-zinc-500">
        {job.observed_generation} / {job.generation} · {job.desired_state}
      </span>,
    ],
  ].filter(Boolean) as [string, ReactNode][];

  return (
    <Disclosure title={t('administration.jobs.detail.technical')}>
      <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] items-center gap-x-3 gap-y-0.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="min-w-0">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-400">{t('administration.jobs.detail.specAndDetail')}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
          {t('administration.jobs.detail.copyJson')}
          <CopyButton text={JSON.stringify(job, null, 2)} label={t('administration.jobs.detail.copyJson')} />
        </span>
      </div>
      <pre className="mt-1 max-h-56 overflow-auto rounded bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300">
        {JSON.stringify({ spec: job.spec, detail: job.detail }, null, 2)}
      </pre>
    </Disclosure>
  );
}

/**
 * One job in the drawer: state and the one action that fits it, why it failed, the steps of an
 * extraction run, every Celery task it ran (follow-ups nested), the publication's other jobs, and
 * the timeline and ids folded away for debugging.
 */
export default function JobDetail({ jobId, onOpenJob }: { jobId: string; onOpenJob: (id: string) => void }) {
  const { t } = useTranslation();
  const { data: job, isLoading, isError, isFetching, refetch } = useJob(jobId);
  const { data: kinds } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const [dialog, setDialog] = useState<'retry' | 'rerun' | 'cancel' | 'reencrypt' | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <CircleLoader size={28} color="#0077cc" />
      </div>
    );
  }
  if (isError || !job) {
    return (
      <p className="text-sm text-redText dark:text-red">
        {t('administration.jobs.loadError')}{' '}
        <button type="button" className="font-medium underline" onClick={() => refetch()}>
          {t('administration.table.retry')}
        </button>
      </p>
    );
  }

  const kind = kinds?.find((k) => k.kind === job.kind);
  const active = ACTIVE_JOB_STATES.includes(job.state);
  const apply = { kind: job.kind, subject_id: job.subject_id, spec: job.spec };
  const dialogAction: JobDialogAction | null =
    dialog === 'cancel'
      ? { type: 'cancel', id: job.id }
      : dialog === 'reencrypt'
        ? { type: 'apply', body: { ...apply, spec: { ...job.spec, reencrypt: true } } }
        : dialog
          ? { type: 'apply', body: apply }
          : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <JobStateChip job={job} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {[
              job.attempts > 0 && t('administration.jobs.detail.attemptOf', { count: job.attempts, max: kind?.max_attempts ?? 1 }),
              job.last_transition_at && t('administration.jobs.detail.since', { date: fmtDateTime(job.last_transition_at) }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {isFetching && <FiRefreshCw className="animate-spin text-zinc-400" size={12} aria-label={t('administration.jobs.refreshing')} />}
          <div className="ml-auto flex gap-1.5">
            {/* A stuck job may have lost its task: offer a re-send; the dry run says whether it would do anything. */}
            {job.stale && (
              <button type="button" className={bulkBtn} onClick={() => setDialog('retry')}>
                <FiPlay size={12} /> {t('administration.jobs.actions.retry')}
              </button>
            )}
            {active ? (
              <button type="button" className={bulkBtnDanger} onClick={() => setDialog('cancel')}>
                <FiSquare size={11} /> {t('administration.jobs.actions.cancel')}
              </button>
            ) : job.kind === 'readium.encrypt' && job.state === 'succeeded' ? null : (
              // A registered LCP package refuses a plain re-apply; "Re-encrypt" below is its action.
              <button type="button" className={bulkBtn} onClick={() => setDialog(job.state === 'failed' ? 'retry' : 'rerun')}>
                {job.state === 'failed' ? <FiPlay size={12} /> : <FiRotateCw size={12} />}{' '}
                {job.state === 'failed' ? t('administration.jobs.actions.retry') : t('administration.jobs.actions.rerun')}
              </button>
            )}
            {job.kind === 'readium.encrypt' && job.state === 'succeeded' && (
              <button type="button" className={bulkBtn} onClick={() => setDialog('reencrypt')} title={t('administration.jobs.actions.reencryptHint')}>
                {t('administration.jobs.actions.reencrypt')}
              </button>
            )}
          </div>
        </div>
        {job.reason && (
          <div className="relative">
            <pre
              className={twMerge(
                'max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md p-2.5 pr-8 text-xs',
                job.state === 'blocked' ? 'bg-amber-400/10 text-amber-800 dark:text-amber-200' : 'bg-red/10 text-redText dark:text-red'
              )}
            >
              {job.reason}
            </pre>
            <CopyButton text={job.reason} label={t('administration.jobs.detail.copyError')} className="absolute right-1 top-1" />
          </div>
        )}
      </section>

      {job.detail.extraction_run && Object.keys(job.detail.extraction_run.jobs).length > 0 && <Steps jobs={job.detail.extraction_run.jobs} runFailed={job.state === 'failed'} />}
      <Tasks jobId={job.id} active={active} />
      <Related job={job} onOpen={onOpenJob} />

      <div className="flex flex-col gap-2">
        <Timeline job={job} />
        <Technical job={job} />
      </div>

      <JobActionDialog
        action={dialogAction}
        title={
          dialog === 'cancel'
            ? t('administration.jobs.actions.cancelTitle')
            : dialog === 'reencrypt'
              ? t('administration.jobs.actions.reencryptTitle')
              : t('administration.jobs.actions.applyTitle', { kind: kindLabel(job.kind) })
        }
        message={
          dialog === 'cancel'
            ? t('administration.jobs.actions.cancelBody')
            : dialog === 'reencrypt'
              ? t('administration.jobs.actions.reencryptBody')
              : job.kind === 'extraction.run' && job.detail.extraction_run?.is_active
                ? // The catalog resets this very run (results and crops deleted) before it starts again.
                  t('administration.jobs.actions.rerunExtractionBody')
                : undefined
        }
        confirmLabel={
          dialog === 'cancel'
            ? t('administration.jobs.actions.cancel')
            : dialog === 'reencrypt'
              ? t('administration.jobs.actions.reencrypt')
              : dialog === 'retry'
                ? t('administration.jobs.actions.retry')
                : t('administration.jobs.actions.rerun')
        }
        destructive={
          dialog === 'cancel' || dialog === 'reencrypt' || (job.kind === 'extraction.run' && !!job.detail.extraction_run?.is_active)
        }
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
