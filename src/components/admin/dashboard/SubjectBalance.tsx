import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowDownRight, FiArrowUpRight, FiMinus } from 'react-icons/fi';
import { ChartCard, TooltipBox } from './ChartCard';
import { fmtCount, fmtPct } from './format';
import { SubjectNames, SubjectRow } from './semantic';

/** Below this many loans in the whole period, shares swing on a single loan. */
const FEW_LOANS = 10;
/** PEU band read as "in proportion". */
const LOW = 0.8;
const HIGH = 1.25;

type Direction = 'under' | 'over' | 'even';
const directionOf = (r: SubjectRow): Direction =>
  r.peu == null || (r.peu >= LOW && r.peu <= HIGH)
    ? 'even'
    : r.peu > HIGH
      ? 'under'
      : 'over';

/** Demand above supply = warm (needs licences), below = cool (licences idle); neutral grey in proportion. */
const TONE: Record<Direction, string> = {
  under: 'var(--viz-s2)',
  over: 'var(--viz-s1)',
  even: 'var(--viz-muted)',
};

const ICON = {
  under: FiArrowUpRight,
  over: FiArrowDownRight,
  even: FiMinus,
};

/**
 * "Do licences sit where readers borrow?" — per catalogue subject, its share of LCP copies (supply)
 * against its share of loans (demand): a dumbbell per subject. The ratio of the two is the
 * Percentage of Expected Use (Bonn's use factor × 100, after Mills): above 100 % the subject is
 * borrowed more than its licences would predict, below it its licences sit idle.
 */
export default function SubjectBalance({
  subjects,
  names,
  onOpenSubject,
}: {
  subjects: SubjectRow[];
  names: SubjectNames;
  onOpenSubject: (term: string) => void;
}) {
  const { t } = useTranslation();
  const k = 'administration.dashboard.subjects';
  const [hover, setHover] = useState<string | null>(null);
  const label = (r: SubjectRow) =>
    r.term == null ? t(`${k}.notOnGraph`) : names.label(r.term);

  const licensed = subjects
    .filter((r) => r.copies > 0)
    .sort(
      (a, b) =>
        b.loanShare - b.copyShare - (a.loanShare - a.copyShare) ||
        b.copies - a.copies
    );
  const openOnly = subjects
    .filter((r) => r.copies === 0 && r.term != null)
    .sort((a, b) => b.publications - a.publications);
  const totalLoans = subjects.reduce((s, r) => s + r.loans, 0);
  const max = Math.max(
    0.1,
    ...licensed.flatMap((r) => [r.copyShare, r.loanShare])
  );
  const top = Math.min(1, Math.ceil(max * 10) / 10);
  const ticks = [0, top / 2, top];
  const x = (v: number) => `${(v / top) * 100}%`;

  const under = licensed.find((r) => directionOf(r) === 'under' && r.loans > 0);
  const over = [...licensed]
    .reverse()
    .find((r) => directionOf(r) === 'over' && r.copyShare >= 0.05);

  const insight =
    totalLoans === 0
      ? t(`${k}.insightNoLoans`)
      : [
          under &&
            // High expected use is proportion, not shortage: only call for licences under real pressure.
            t(
              under.queued > 0 || under.inUse >= under.copies
                ? `${k}.insightUnderPressed`
                : `${k}.insightUnder`,
              {
                subject: label(under),
                loans: fmtPct(under.loanShare),
                copies: fmtPct(under.copyShare),
              }
            ),
          under &&
            under.lcpTitles === 1 &&
            t(`${k}.insightThin`),
          over &&
            t(`${k}.insightOver`, {
              subject: label(over),
              loans: fmtPct(over.loanShare),
              copies: fmtPct(over.copyShare),
            }),
          !under && !over && t(`${k}.insightEven`),
        ]
          .filter(Boolean)
          .join(' ');

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      insight={insight}
      table={{
        columns: [
          t(`${k}.col.subject`),
          t(`${k}.col.publications`),
          t(`${k}.col.open`),
          t(`${k}.col.lcp`),
          t(`${k}.col.copies`),
          t(`${k}.col.copyShare`),
          t('administration.dashboard.col.loans'),
          t(`${k}.col.loanShare`),
          t(`${k}.col.peu`),
          t('administration.dashboard.col.waiting'),
          t(`${k}.col.unused`),
        ],
        rows: [...licensed, ...openOnly].map((r) => [
          label(r),
          r.publications,
          r.openTitles,
          r.lcpTitles,
          r.copies,
          fmtPct(r.copyShare),
          r.loans,
          fmtPct(r.loanShare),
          r.peu == null ? '—' : fmtPct(r.peu),
          r.queued,
          r.unused,
        ]),
      }}
    >
      {licensed.length === 0 ? (
        <p className='py-6 text-center text-sm text-zinc-500'>
          {t(`${k}.noLicensed`)}
        </p>
      ) : (
        <div role='list' aria-label={t(`${k}.aria`)}>
          {/* Scale header: aligned with the track column below. */}
          <div className='mb-1 grid grid-cols-[minmax(7rem,13rem)_1fr_4.5rem] items-end gap-3 text-[11px] text-zinc-500 sm:grid-cols-[minmax(9rem,15rem)_1fr_5.5rem] dark:text-zinc-400'>
            <span>{t(`${k}.col.subject`)}</span>
            <span className='relative h-4'>
              {ticks.map((v, i) => (
                <span
                  key={v}
                  className='absolute whitespace-nowrap tabular-nums'
                  style={{
                    left: x(v),
                    transform:
                      i === 0
                        ? 'none'
                        : i === ticks.length - 1
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)',
                  }}
                >
                  {fmtPct(v)}
                </span>
              ))}
            </span>
            <span
              className='text-right'
              title={t(`${k}.peuHelp`)}
            >
              {t(`${k}.col.peu`)}
            </span>
          </div>
          {licensed.map((r) => {
            const dir = directionOf(r);
            const Icon = ICON[dir];
            const key = r.term ?? '∅';
            const lo = Math.min(r.copyShare, r.loanShare);
            const hi = Math.max(r.copyShare, r.loanShare);
            const clickable = r.term != null && !!names.idOf(r.term);
            return (
              <div key={key} role='listitem' className='relative'>
                <button
                  type='button'
                  disabled={!clickable}
                  onClick={() => r.term && onOpenSubject(r.term)}
                  onPointerEnter={() => setHover(key)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(key)}
                  onBlur={() => setHover(null)}
                  aria-label={t(`${k}.rowAria`, {
                    subject: label(r),
                    copies: fmtPct(r.copyShare),
                    loans: fmtPct(r.loanShare),
                    peu: r.peu == null ? '—' : fmtPct(r.peu),
                  })}
                  className='grid w-full grid-cols-[minmax(7rem,13rem)_1fr_4.5rem] items-center gap-3 rounded-md py-1.5 text-left enabled:hover:bg-zinc-50 sm:grid-cols-[minmax(9rem,15rem)_1fr_5.5rem] dark:enabled:hover:bg-zinc-700/40'
                >
                  <span className='min-w-0'>
                    <span className='block truncate text-sm text-zinc-800 dark:text-zinc-100'>
                      {label(r)}
                    </span>
                    <span className='block truncate text-[11px] text-zinc-500 dark:text-zinc-400'>
                      {t(`${k}.meta`, {
                        lcp: r.lcpTitles,
                        copies: r.copies,
                        open: r.openTitles,
                      })}
                      {r.queued > 0 &&
                        ` · ${t('administration.dashboard.leaderboard.waiting', { count: r.queued })}`}
                    </span>
                  </span>
                  <span className='relative h-5'>
                    <span className='absolute inset-x-0 top-1/2 h-px bg-[color:var(--viz-grid)]' />
                    <span
                      className='absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full'
                      style={{
                        left: x(lo),
                        width: `calc(${x(hi)} - ${x(lo)})`,
                        background: TONE[dir],
                      }}
                    />
                    {/* Supply: hollow ring. Demand: filled dot in the direction's tone. */}
                    <span
                      className='absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--viz-ink-2)] bg-[color:var(--viz-surface)]'
                      style={{ left: x(r.copyShare) }}
                    />
                    <span
                      className='absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[color:var(--viz-surface)]'
                      style={{ left: x(r.loanShare), background: TONE[dir] }}
                    />
                  </span>
                  <span className='flex items-center justify-end gap-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50'>
                    <Icon
                      size={13}
                      aria-hidden
                      style={{ color: TONE[dir] }}
                    />
                    {r.peu == null ? '—' : fmtPct(r.peu)}
                  </span>
                </button>
                {hover === key && (
                  <div className='pointer-events-none absolute left-1/3 top-full z-20 -mt-1'>
                    <TooltipBox
                      title={label(r)}
                      rows={[
                        {
                          label: t(`${k}.tt.copies`, { count: r.copies }),
                          value: fmtPct(r.copyShare),
                        },
                        {
                          label: t(`${k}.tt.loans`, { count: r.loans }),
                          value: fmtPct(r.loanShare),
                        },
                        {
                          label: t(`${k}.tt.inUse`, { copies: r.copies }),
                          value: fmtCount(r.inUse),
                        },
                        {
                          label: t(`${k}.tt.unused`),
                          value: fmtCount(r.unused),
                        },
                      ]}
                      footer={t(`${k}.tt.${dir}`)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300'>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full border-2 border-[color:var(--viz-ink-2)]' />
          {t(`${k}.legend.copies`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-s2)]' />
          {t(`${k}.legend.under`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-s1)]' />
          {t(`${k}.legend.over`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-muted)]' />
          {t(`${k}.legend.even`)}
        </span>
      </div>
      {totalLoans > 0 && totalLoans < FEW_LOANS && (
        <p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>
          {t(`${k}.fewLoans`, { count: totalLoans })}
        </p>
      )}
      {openOnly.length > 0 && (
        <div className='mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-700'>
          <p className='mb-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
            {t(`${k}.openOnly`)}
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {openOnly.map((r) => (
              <button
                key={r.term}
                type='button'
                disabled={!names.idOf(r.term)}
                onClick={() => r.term && onOpenSubject(r.term)}
                className='rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-700 enabled:hover:border-primary dark:border-zinc-600 dark:text-zinc-200'
              >
                {label(r)}{' '}
                <span className='tabular-nums text-zinc-400'>
                  {r.publications}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
