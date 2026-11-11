import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import {
  ICategoryStatistics,
  IHoldOutcomes,
  ILoanOutcomes,
  IStatisticsHeatCell,
} from '../../../utils/interfaces/statistics';
import { ChartCard, Legend, Responsive, TooltipBox } from './ChartCard';
import { fmtCount, fmtPct, tooltipStyle } from './format';

/* ───────────────────────────── Weekday × hour heatmap ───────────────────────────── */

const SEQ = [
  'var(--viz-seq-0)',
  'var(--viz-seq-1)',
  'var(--viz-seq-2)',
  'var(--viz-seq-3)',
  'var(--viz-seq-4)',
];
const HM = { left: 34, top: 4, bottom: 22, cell: 22, gap: 2 };

const HeatGrid = ({
  cells,
  width,
  days,
}: {
  cells: IStatisticsHeatCell[];
  width: number;
  days: string[];
}) => {
  const { t } = useTranslation();
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<IStatisticsHeatCell>();
  const max = Math.max(1, ...cells.map((c) => c.loans));
  const cw = Math.max(8, (width - HM.left) / 24);
  const h = HM.top + 7 * HM.cell + HM.bottom;
  const step = (v: number) =>
    v === 0 ? 0 : Math.min(4, 1 + Math.floor((v / max) * 3.999));

  return (
    <div className='relative'>
      <svg
        width={width}
        height={h}
        role='img'
        aria-label={t('administration.dashboard.heatmap.aria')}
      >
        {days.map((d, i) => (
          <text
            key={d}
            x={HM.left - 6}
            y={HM.top + i * HM.cell + HM.cell / 2 + 4}
            textAnchor='end'
            className='fill-[color:var(--viz-muted)] text-[11px]'
          >
            {d}
          </text>
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((hr) => (
          <text
            key={hr}
            x={HM.left + hr * cw + 1}
            y={h - 6}
            className='fill-[color:var(--viz-muted)] text-[11px] tabular-nums'
          >
            {String(hr).padStart(2, '0')}
          </text>
        ))}
        {cells.map((c) => {
          const isHover =
            tooltipData &&
            tooltipData.dow === c.dow &&
            tooltipData.hour === c.hour;
          return (
            <rect
              key={`${c.dow}-${c.hour}`}
              x={HM.left + c.hour * cw + HM.gap / 2}
              y={HM.top + c.dow * HM.cell + HM.gap / 2}
              width={cw - HM.gap}
              height={HM.cell - HM.gap}
              rx={3}
              fill={SEQ[step(c.loans)]}
              stroke={isHover ? 'var(--viz-ink)' : 'none'}
              strokeWidth={1.5}
              tabIndex={-1}
              onPointerEnter={() =>
                showTooltip({
                  tooltipData: c,
                  tooltipLeft: HM.left + c.hour * cw + cw / 2,
                  tooltipTop: HM.top + c.dow * HM.cell,
                })
              }
              onPointerLeave={hideTooltip}
            />
          );
        })}
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          unstyled
          applyPositionStyle
          style={tooltipStyle}
          offsetLeft={10}
          offsetTop={-36}
        >
          <TooltipBox
            title={`${days[tooltipData.dow]} ${String(tooltipData.hour).padStart(2, '0')}:00–${String(tooltipData.hour + 1).padStart(2, '0')}:00`}
            rows={[
              {
                label: t('administration.dashboard.heatmap.loans'),
                value: fmtCount(tooltipData.loans),
              },
            ]}
          />
        </TooltipWithBounds>
      )}
    </div>
  );
};

export const BorrowHeatmap = ({ cells }: { cells: IStatisticsHeatCell[] }) => {
  const { t } = useTranslation();
  const days = t('administration.dashboard.heatmap.days', {
    returnObjects: true,
  }) as string[];
  const peak = cells.reduce<IStatisticsHeatCell | null>(
    (m, c) => (!m || c.loans > m.loans ? c : m),
    null
  );
  const total = cells.reduce((s, c) => s + c.loans, 0);
  const evening = cells
    .filter((c) => c.hour >= 18 || c.hour < 6)
    .reduce((s, c) => s + c.loans, 0);
  const weekend = cells
    .filter((c) => c.dow >= 5)
    .reduce((s, c) => s + c.loans, 0);

  return (
    <ChartCard
      title={t('administration.dashboard.heatmap.title')}
      description={t('administration.dashboard.heatmap.description')}
      insight={
        peak && total > 0
          ? t('administration.dashboard.heatmap.insight', {
              day: days[peak.dow],
              hour: String(peak.hour).padStart(2, '0'),
              evening: fmtPct(evening / total),
              weekend: fmtPct(weekend / total),
            })
          : undefined
      }
      table={{
        columns: [
          t('administration.dashboard.col.day'),
          ...Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')),
        ],
        rows: days.map((d, dow) => [
          d,
          ...cells
            .filter((c) => c.dow === dow)
            .sort((a, b) => a.hour - b.hour)
            .map((c) => c.loans),
        ]),
      }}
    >
      <Responsive>
        {(width) => <HeatGrid cells={cells} width={width} days={days} />}
      </Responsive>
      <div className='mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
        {t('administration.dashboard.heatmap.fewer')}
        {SEQ.map((c) => (
          <span
            key={c}
            className='h-3 w-5 rounded-sm'
            style={{ background: c }}
          />
        ))}
        {t('administration.dashboard.heatmap.more')}
      </div>
    </ChartCard>
  );
};

/* ───────────────────────────── Outcome bars (tall segmented) ───────────────────────────── */

interface Part {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Near-black label on light fills (yellow), white elsewhere. */
  darkText?: boolean;
}

const SegmentedBar = ({
  parts,
  ariaLabel,
}: {
  parts: Part[];
  ariaLabel: string;
}) => {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const [focus, setFocus] = useState<string | null>(null);
  if (!total)
    return (
      <div
        className='h-7 rounded bg-zinc-100 dark:bg-zinc-700'
        aria-label={ariaLabel}
      />
    );
  const active = parts.find((p) => p.key === focus);
  return (
    <div>
      <div
        className='flex h-7 gap-[2px]'
        role='img'
        aria-label={`${ariaLabel}: ${parts.map((p) => `${p.label} ${p.value} (${fmtPct(p.value / total)})`).join(', ')}`}
      >
        {parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const share = p.value / total;
            return (
              <div
                key={p.key}
                tabIndex={0}
                onPointerEnter={() => setFocus(p.key)}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus(p.key)}
                onBlur={() => setFocus(null)}
                className='flex items-center rounded px-1.5 text-xs font-semibold outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-zinc-400'
                style={{
                  width: `${share * 100}%`,
                  background: p.color,
                  color: p.darkText ? '#0b0b0b' : '#ffffff',
                  opacity: focus && focus !== p.key ? 0.55 : 1,
                }}
              >
                {share >= 0.09 ? fmtPct(share) : null}
              </div>
            );
          })}
      </div>
      <div className='mt-1 h-4 text-xs text-zinc-600 dark:text-zinc-300'>
        {active && (
          <>
            <span className='font-semibold text-zinc-900 dark:text-zinc-50'>
              {fmtCount(active.value)}
            </span>{' '}
            {active.label} · {fmtPct(active.value / total, 1)}
          </>
        )}
      </div>
    </div>
  );
};

export const OutcomeBars = ({
  holds,
  loans,
}: {
  holds: IHoldOutcomes;
  loans: ILoanOutcomes;
}) => {
  const { t } = useTranslation();
  const k = 'administration.dashboard.outcomes';
  const holdParts: Part[] = [
    {
      key: 'claimed',
      label: t(`${k}.hold.claimed`),
      value: holds.claimed,
      color: 'var(--viz-s1)',
    },
    {
      key: 'expired',
      label: t(`${k}.hold.expired`),
      value: holds.expired_unclaimed,
      color: 'var(--viz-s2)',
    },
    {
      key: 'cancelled',
      label: t(`${k}.hold.cancelled`),
      value: holds.cancelled,
      color: 'var(--viz-s3)',
    },
    {
      key: 'waiting',
      label: t(`${k}.hold.waiting`),
      value: holds.still_waiting,
      color: 'var(--viz-s4)',
      darkText: true,
    },
  ];
  const loanParts: Part[] = [
    {
      key: 'early',
      label: t(`${k}.loan.early`),
      value: loans.returned_early,
      color: 'var(--viz-s1)',
    },
    {
      key: 'expiry',
      label: t(`${k}.loan.expiry`),
      value: loans.ran_to_expiry,
      color: 'var(--viz-s2)',
    },
    {
      key: 'ended',
      label: t(`${k}.loan.ended`),
      value: loans.revoked + loans.cancelled,
      color: 'var(--viz-s3)',
    },
    {
      key: 'active',
      label: t(`${k}.loan.active`),
      value: loans.still_active,
      color: 'var(--viz-s4)',
      darkText: true,
    },
  ];
  const resolved = holds.claimed + holds.expired_unclaimed + holds.cancelled;
  const finished = loans.returned_early + loans.ran_to_expiry;

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      table={{
        columns: [
          t(`${k}.colOutcome`),
          t('administration.dashboard.col.count'),
          t('administration.dashboard.col.share'),
        ],
        rows: [
          ...holdParts.map((p) => [
            `${t(`${k}.holds`)} — ${p.label}`,
            p.value,
            fmtPct(holds.placed ? p.value / holds.placed : null),
          ]),
          ...loanParts.map((p) => {
            const total = loanParts.reduce((s, q) => s + q.value, 0);
            return [
              `${t(`${k}.loans`)} — ${p.label}`,
              p.value,
              fmtPct(total ? p.value / total : null),
            ];
          }),
        ],
      }}
    >
      <div className='space-y-5'>
        <div>
          <div className='mb-1.5 flex items-baseline justify-between gap-2'>
            <span className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
              {t(`${k}.holds`)}
            </span>
            {resolved > 0 && (
              <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                {t(`${k}.holdsInsight`, {
                  share: fmtPct(holds.claimed / resolved),
                })}
              </span>
            )}
          </div>
          <SegmentedBar parts={holdParts} ariaLabel={t(`${k}.holds`)} />
          <Legend
            items={holdParts.map((p) => ({ label: p.label, color: p.color }))}
          />
        </div>
        <div>
          <div className='mb-1.5 flex items-baseline justify-between gap-2'>
            <span className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
              {t(`${k}.loans`)}
            </span>
            {finished > 0 && (
              <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                {t(`${k}.loansInsight`, {
                  share: fmtPct(loans.returned_early / finished),
                })}
              </span>
            )}
          </div>
          <SegmentedBar parts={loanParts} ariaLabel={t(`${k}.loans`)} />
          <Legend
            items={loanParts.map((p) => ({ label: p.label, color: p.color }))}
          />
        </div>
      </div>
    </ChartCard>
  );
};

/* ───────────────────────────── Top categories ───────────────────────────── */

export const TopCategories = ({
  categories,
}: {
  categories: ICategoryStatistics[];
}) => {
  const { t } = useTranslation();
  const max = Math.max(1, ...categories.map((c) => c.loans));
  const total = categories.reduce((s, c) => s + c.loans, 0);
  return (
    <ChartCard
      title={t('administration.dashboard.categories.title')}
      description={t('administration.dashboard.categories.description')}
      table={{
        columns: [
          t('administration.dashboard.col.category'),
          t('administration.dashboard.col.loans'),
          t('administration.dashboard.col.share'),
        ],
        rows: categories.map((c) => [
          c.title,
          c.loans,
          fmtPct(total ? c.loans / total : null),
        ]),
      }}
    >
      {categories.length === 0 ? (
        <p className='py-8 text-center text-sm text-zinc-500'>
          {t('administration.dashboard.empty')}
        </p>
      ) : (
        <ul className='space-y-2'>
          {categories.map((c) => (
            <li
              key={c.category_id}
              className='grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm'
              title={`${c.title}: ${c.loans}`}
            >
              <span className='truncate text-zinc-700 dark:text-zinc-200'>
                {c.title}
              </span>
              <span className='flex items-center gap-2'>
                <span
                  className='h-3 rounded-r bg-[color:var(--viz-s1)]'
                  style={{ width: `${Math.max(1, (c.loans / max) * 85)}%` }}
                />
                <span className='text-xs tabular-nums text-zinc-600 dark:text-zinc-300'>
                  {fmtCount(c.loans)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
};
