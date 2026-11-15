import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronRight } from 'react-icons/fi';
import { useJobKinds } from '../../../hooks/api/jobs/useJobs';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { useKindLabel } from './jobModel';

const JOBS = NAVIGATION_PATHS.adminJobs;
/** Types whose never-processed publications are started from the older per-publication tables. */
export const PUBLICATION_TABLE_KINDS = ['extraction.run', 'readium.encrypt'];

const crumb = 'text-zinc-500 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100';
const linkBtn = 'inline-flex items-center gap-1 text-sm font-medium text-primaryText hover:underline dark:text-primaryLight';

/**
 * Where a drill-down view sits: "Overview › <job type> › <view>", then the job type's definition (what it does,
 * what one job is about) and the ways to its other views. Every link starts the target view with clean params.
 */
export default function JobsTrail({ kind, view, title }: { kind?: string; view: 'jobs' | 'runs' | 'publications'; title?: string }) {
  const { t } = useTranslation();
  const { data: kinds } = useJobKinds();
  const kindLabel = useKindLabel(kinds);
  const def = kind ? kinds?.find((k) => k.kind === kind) : undefined;

  const parts: ReactNode[] = [
    <Link key="o" to={JOBS} className={crumb}>
      {t('administration.jobs.overview.title')}
    </Link>,
  ];
  // A recorded-only type has no jobs to go back to: no crumb for it.
  if (kind && view !== 'jobs' && def?.keyed !== false) {
    parts.push(
      <Link key="k" to={`${JOBS}?kind=${encodeURIComponent(kind)}`} className={crumb}>
        {kindLabel(kind)}
      </Link>
    );
  }

  const heading =
    title ??
    (kind
      ? view === 'jobs'
        ? kindLabel(kind)
        : view === 'runs'
          ? t('administration.jobs.trail.runsOf', { kind: kindLabel(kind) })
          : t('administration.jobs.trail.publicationsOf', { kind: kindLabel(kind) })
      : view === 'runs'
        ? t('administration.jobs.trail.allRuns')
        : t('administration.jobs.trail.allJobs'));

  return (
    <div className="mb-4 px-5">
      <nav aria-label={t('administration.jobs.trail.label')} className="mb-1 flex flex-wrap items-center gap-1 text-xs">
        {parts.map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {p}
            <FiChevronRight size={12} className="text-zinc-300 dark:text-zinc-600" aria-hidden />
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-xl font-bold text-secondary dark:text-secondaryLight">{heading}</h2>
        {/* The level shown, named, so a type, a job and a run are never confused. */}
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          {view === 'jobs' ? t('administration.jobs.levels.jobs') : view === 'runs' ? t('administration.jobs.levels.runs') : t('administration.jobs.levels.publications')}
        </span>
        <span className="ml-auto flex flex-wrap gap-4">
          {kind && view === 'jobs' && PUBLICATION_TABLE_KINDS.includes(kind) && (
            <Link to={`${JOBS}?view=publications&kind=${encodeURIComponent(kind)}`} className={linkBtn}>
              {t('administration.jobs.trail.toPublications')} <FiArrowRight size={13} />
            </Link>
          )}
          {view !== 'runs' && (
            <Link to={`${JOBS}?view=runs${kind ? `&kind=${encodeURIComponent(kind)}` : ''}`} className={linkBtn}>
              {t('administration.jobs.trail.toRuns')} <FiArrowRight size={13} />
            </Link>
          )}
          {view === 'runs' && kind && def?.keyed && (
            <Link to={`${JOBS}?kind=${encodeURIComponent(kind)}`} className={linkBtn}>
              {t('administration.jobs.trail.toJobs')} <FiArrowRight size={13} />
            </Link>
          )}
        </span>
      </div>
      {def && view === 'jobs' && (
        <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
          {[
            t(`administration.jobs.subject.${def.subject_type ?? 'none'}`, { defaultValue: def.subject_type ?? '' }),
            t('administration.jobs.trail.maxAttempts', { count: def.max_attempts }),
          ]
            .filter(Boolean)
            .join(' · ')}
          <span className="mt-0.5 block text-xs text-zinc-400" lang="en">
            {def.description}
          </span>
        </p>
      )}
    </div>
  );
}
