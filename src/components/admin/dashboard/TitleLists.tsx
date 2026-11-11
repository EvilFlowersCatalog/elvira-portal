import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { ChartCard } from './ChartCard';
import { dateLocale, fmtCount, fmtPct, fmtRatio } from './format';

interface ListProps {
  titles: ITitleStatistics[];
  onOpen: (entryId: string) => void;
}

/** Thin meter: the track is a lighter step of the fill's own ramp, so the whole bar reads as one quantity. */
const Meter = ({ value }: { value: number }) => (
  <div className='h-2 w-full rounded-full bg-[color:var(--viz-seq-0)]'>
    <div
      className='h-2 rounded-full bg-[color:var(--viz-s1)]'
      style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
    />
  </div>
);

/** "Most-used LCP titles": utilization = loan-days ÷ copy-days, the fairest busy-ness measure across copy counts. */
export const UtilizationLeaderboard = ({ titles, onOpen }: ListProps) => {
  const { t } = useTranslation();
  const top = titles.filter((d) => d.loans > 0).slice(0, 8);
  return (
    <ChartCard
      title={t('administration.dashboard.leaderboard.title')}
      description={t('administration.dashboard.leaderboard.description')}
      table={{
        columns: [
          t('administration.dashboard.col.title'),
          t('administration.dashboard.col.utilization'),
          t('administration.dashboard.col.inUse'),
          t('administration.dashboard.col.waiting'),
          t('administration.dashboard.col.loans'),
          t('administration.dashboard.col.turnover'),
          t('administration.dashboard.col.avgLoan'),
        ],
        rows: titles.map((d) => [
          d.title,
          fmtPct(d.utilization),
          `${d.in_use}/${d.copies}`,
          d.queued,
          d.loans,
          fmtRatio(d.turnover),
          d.avg_loan_days == null ? '—' : `${d.avg_loan_days.toFixed(1)} d`,
        ]),
      }}
    >
      {top.length === 0 ? (
        <p className='py-8 text-center text-sm text-zinc-500'>
          {t('administration.dashboard.empty')}
        </p>
      ) : (
        <ol className='space-y-1'>
          {top.map((d, i) => (
            <li key={d.entry_id}>
              <button
                type='button'
                onClick={() => onOpen(d.entry_id)}
                className='group grid w-full grid-cols-[1.25rem_1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
              >
                <span className='row-span-2 text-xs font-semibold tabular-nums text-zinc-400'>
                  {i + 1}
                </span>
                <span className='min-w-0 truncate text-sm font-medium text-zinc-800 group-hover:underline dark:text-zinc-100'>
                  {d.title}
                </span>
                <span className='text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50'>
                  {fmtPct(d.utilization)}
                </span>
                <Meter value={d.utilization} />
                <span className='justify-self-end whitespace-nowrap text-xs tabular-nums text-zinc-500 dark:text-zinc-400'>
                  {t('administration.dashboard.leaderboard.inUse', {
                    inUse: d.in_use,
                    copies: d.copies,
                  })}
                  {d.queued > 0 && (
                    <span className='ml-1.5 rounded bg-orange-50 px-1 py-px font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'>
                      {t('administration.dashboard.leaderboard.waiting', {
                        count: d.queued,
                      })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
};

/**
 * Dead stock (ISO 11620 "percentage of stock not used"): LCP titles with no
 * loan in the period, excluding ones added after the period began.
 */
export const DormantTitles = ({
  titles,
  onOpen,
  periodFrom,
}: ListProps & { periodFrom: string }) => {
  const { t, i18n } = useTranslation();
  const from = parseISO(periodFrom);
  const eligible = titles.filter((d) => parseISO(d.added_at) < from);
  const dormant = eligible
    .filter((d) => d.loans === 0)
    .sort((a, b) => b.copies - a.copies || a.title.localeCompare(b.title));
  const idleCopies = dormant.reduce((s, d) => s + d.copies, 0);
  const share = eligible.length ? dormant.length / eligible.length : null;
  const locale = dateLocale(i18n.language);
  const lastLoan = (d: ITitleStatistics) =>
    d.last_loan_at
      ? t('administration.dashboard.dormant.lastLoan', {
          ago: formatDistanceToNowStrict(parseISO(d.last_loan_at), {
            locale,
            addSuffix: true,
          }),
        })
      : t('administration.dashboard.dormant.never');

  return (
    <ChartCard
      title={t('administration.dashboard.dormant.title')}
      description={t('administration.dashboard.dormant.description')}
      table={{
        columns: [
          t('administration.dashboard.col.title'),
          t('administration.dashboard.col.copies'),
          t('administration.dashboard.col.lastLoan'),
        ],
        rows: dormant.map((d) => [d.title, d.copies, lastLoan(d)]),
      }}
    >
      {eligible.length === 0 ? (
        <p className='py-8 text-center text-sm text-zinc-500'>
          {t('administration.dashboard.empty')}
        </p>
      ) : (
        <>
          <div className='mb-3 flex items-baseline gap-3'>
            <span className='text-3xl font-bold text-zinc-900 dark:text-zinc-50'>
              {fmtPct(share)}
            </span>
            <span className='text-sm text-zinc-600 dark:text-zinc-300'>
              {t('administration.dashboard.dormant.summary', {
                count: dormant.length,
                total: eligible.length,
                copies: fmtCount(idleCopies),
              })}
            </span>
          </div>
          {dormant.length === 0 ? (
            <p className='text-sm text-zinc-500'>
              {t('administration.dashboard.dormant.none')}
            </p>
          ) : (
            <ul className='divide-y divide-zinc-100 dark:divide-zinc-700'>
              {dormant.slice(0, 6).map((d) => (
                <li key={d.entry_id}>
                  <button
                    type='button'
                    onClick={() => onOpen(d.entry_id)}
                    className='flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm hover:underline'
                  >
                    <span className='min-w-0 truncate text-zinc-800 dark:text-zinc-100'>
                      {d.title}
                    </span>
                    <span className='shrink-0 text-xs text-zinc-500 dark:text-zinc-400'>
                      {t('administration.dashboard.dormant.copies', {
                        count: d.copies,
                      })}{' '}
                      · {lastLoan(d)}
                    </span>
                  </button>
                </li>
              ))}
              {dormant.length > 6 && (
                <li className='pt-2 text-xs text-zinc-500'>
                  {t('administration.dashboard.dormant.more', {
                    count: dormant.length - 6,
                  })}
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </ChartCard>
  );
};
