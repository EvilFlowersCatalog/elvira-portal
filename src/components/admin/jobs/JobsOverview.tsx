import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiAlertOctagon, FiChevronRight, FiClock, FiList, FiLoader } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { useJobKinds, useJobSummary } from '../../../hooks/api/jobs/useJobs';
import { IJobKind, IJobSummaryRow, JobState } from '../../../utils/interfaces/jobs';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import ScheduledJobs from './ScheduledJobs';
import { kindGroup, useKindLabel } from './jobModel';

const JOBS = NAVIGATION_PATHS.adminJobs;

/** Segments of a type's state bar, in reading order; colours match the state chips. */
const SEGMENTS: { states: JobState[]; className: string }[] = [
  // Solid tokens: the custom colours (greenText, primary) don't take Tailwind opacity modifiers.
  { states: ['succeeded'], className: 'bg-greenText dark:bg-green' },
  { states: ['pending', 'queued', 'running', 'cancelling'], className: 'bg-primary' },
  { states: ['blocked'], className: 'bg-amber-500' },
  { states: ['failed'], className: 'bg-redText dark:bg-red' },
  { states: ['cancelled'], className: 'bg-zinc-400 dark:bg-zinc-500' },
];

const sum = (row: IJobSummaryRow | undefined, states: JobState[]) => states.reduce((n, s) => n + (row?.states[s] ?? 0), 0);
const total = (row: IJobSummaryRow | undefined) => Object.values(row?.states ?? {}).reduce((n, c) => n + (c ?? 0), 0);

const card = 'rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800';
const groupTitle = 'mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200';
const groupHint = 'mb-3 text-xs text-zinc-500 dark:text-zinc-400';

function Tile({ to, icon, value, label, tone }: { to: string; icon: React.ReactNode; value: number | undefined; label: string; tone: string }) {
  return (
    <Link to={to} className={twMerge(card, 'flex items-center gap-3 px-4 py-3 transition hover:shadow-md')}>
      <span className={twMerge('shrink-0', value ? tone : 'text-zinc-300 dark:text-zinc-600')}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{value == null ? '…' : value.toLocaleString()}</span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </span>
    </Link>
  );
}

/** One job type: what it is, how its jobs stand right now (a stacked bar), and the way into them. */
function TypeRow({ kind, row }: { kind: IJobKind; row: IJobSummaryRow | undefined }) {
  const { t } = useTranslation();
  const label = useKindLabel([kind]);
  const n = total(row);
  const failed = sum(row, ['failed']);
  const active = sum(row, ['pending', 'queued', 'running', 'cancelling']);
  return (
    <li>
      <Link
        to={`${JOBS}?kind=${encodeURIComponent(kind.kind)}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 md:grid-cols-[minmax(0,1.4fr)_minmax(8rem,1fr)_auto]"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-zinc-800 dark:text-zinc-100">{label(kind.kind)}</span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400" title={kind.description}>
            {t(`administration.jobs.subject.${kind.subject_type ?? 'none'}`, { defaultValue: kind.subject_type ?? '' })}
          </span>
        </span>
        <span
          className="col-span-2 row-start-2 flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700 md:col-span-1 md:row-start-auto"
          role="img"
          aria-label={t('administration.jobs.overview.barLabel', { total: n, failed, active })}
        >
          {n > 0 &&
            SEGMENTS.map((seg) => {
              const c = sum(row, seg.states);
              return c ? <span key={seg.states[0]} className={seg.className} style={{ width: `${(c / n) * 100}%` }} /> : null;
            })}
        </span>
        <span className="flex items-center gap-3 text-xs tabular-nums">
          {failed > 0 && <span className="font-semibold text-redText dark:text-red">{t('administration.jobs.overview.failed', { count: failed })}</span>}
          {active > 0 && <span className="text-primaryText dark:text-primaryLight">{t('administration.jobs.overview.active', { count: active })}</span>}
          <span className="text-zinc-400">{t('administration.jobs.overview.total', { count: n })}</span>
          <FiChevronRight className="text-zinc-300 dark:text-zinc-600" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

/**
 * Landing view of "Background jobs": health at a glance, then the job TYPES the catalog defines —
 * publication processing (one job per file or publication), maintenance (one job each, on a schedule)
 * and recorded-only tasks (runs without a job). A type opens its jobs; a job opens its runs.
 */
export default function JobsOverview() {
  const { t } = useTranslation();
  const { data: kinds } = useJobKinds();
  const { data: summary } = useJobSummary();
  const label = useKindLabel(kinds);

  const byKind = useMemo(() => new Map((summary ?? []).map((r) => [r.kind, r])), [summary]);
  const all = (states: JobState[]) => summary?.reduce((n, r) => n + sum(r, states), 0);
  const stale = summary?.reduce((n, r) => n + r.stale, 0);

  const sorted = (group: ReturnType<typeof kindGroup>) =>
    (kinds ?? [])
      .filter((k) => kindGroup(k) === group)
      // Most failures first, then most jobs, then by name: what needs a look rises to the top.
      .sort(
        (a, b) =>
          sum(byKind.get(b.kind), ['failed']) - sum(byKind.get(a.kind), ['failed']) ||
          total(byKind.get(b.kind)) - total(byKind.get(a.kind)) ||
          label(a.kind).localeCompare(label(b.kind))
      );
  const publication = sorted('publication');
  const recorded = sorted('log');

  return (
    <div className="flex flex-col gap-8 px-5">
      <section aria-label={t('administration.jobs.overview.health')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile to={`${JOBS}?view=jobs&state=failed`} icon={<FiAlertOctagon size={22} />} value={all(['failed'])} label={t('administration.jobs.overview.tiles.failed')} tone="text-redText dark:text-red" />
        <Tile to={`${JOBS}?view=jobs&state=stuck`} icon={<FiClock size={22} />} value={stale} label={t('administration.jobs.overview.tiles.stuck')} tone="text-amber-600 dark:text-amber-300" />
        <Tile
          to={`${JOBS}?view=jobs&state=active`}
          icon={<FiLoader size={22} />}
          value={all(['pending', 'queued', 'running', 'cancelling'])}
          label={t('administration.jobs.overview.tiles.active')}
          tone="text-primaryText dark:text-primaryLight"
        />
        <Tile to={`${JOBS}?view=jobs&state=all`} icon={<FiList size={22} />} value={summary?.reduce((n, r) => n + total(r), 0)} label={t('administration.jobs.overview.tiles.all')} tone="text-zinc-600 dark:text-zinc-300" />
      </section>

      <section data-guide="jobs-types">
        <h2 className={groupTitle}>{t('administration.jobs.overview.publication')}</h2>
        <p className={groupHint}>{t('administration.jobs.overview.publicationHint')}</p>
        <ul className={twMerge(card, 'divide-y divide-zinc-100 dark:divide-zinc-700/60')}>
          {publication.map((k) => (
            <TypeRow key={k.kind} kind={k} row={byKind.get(k.kind)} />
          ))}
          {!kinds && <li className="px-4 py-6 text-sm text-zinc-400">…</li>}
        </ul>
      </section>

      <section className="-mx-5">
        <div className="px-5">
          <h2 className={groupTitle}>{t('administration.jobs.overview.maintenance')}</h2>
          <p className={groupHint}>{t('administration.jobs.overview.maintenanceHint')}</p>
        </div>
        <ScheduledJobs />
      </section>

      {recorded.length > 0 && (
        <section>
          <h2 className={groupTitle}>{t('administration.jobs.overview.recorded')}</h2>
          <p className={groupHint}>{t('administration.jobs.overview.recordedHint')}</p>
          <ul className={twMerge(card, 'divide-y divide-zinc-100 dark:divide-zinc-700/60')}>
            {recorded.map((k) => (
              <li key={k.kind}>
                <Link to={`${JOBS}?view=runs&kind=${encodeURIComponent(k.kind)}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-zinc-800 dark:text-zinc-100">{label(k.kind)}</span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{k.description}</span>
                  </span>
                  <span className="text-xs text-primaryText dark:text-primaryLight">{t('administration.jobs.overview.showRuns')}</span>
                  <FiChevronRight className="text-zinc-300 dark:text-zinc-600" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
