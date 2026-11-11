import { useTranslation } from 'react-i18next';
import { scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveLinear } from '@visx/curve';
import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi';
import { IKpi, IStatisticsKpis } from '../../../utils/interfaces/statistics';
import { fmtCount, fmtHours, fmtPct, relDelta } from './format';

const Sparkline = ({ values }: { values: (number | null)[] }) => {
  const pts = values
    .map((v, i) => ({ i, v }))
    .filter((p): p is { i: number; v: number } => p.v != null);
  if (pts.length < 2) return <div className='h-8' />;
  const w = 120;
  const h = 32;
  const x = scaleLinear({ domain: [0, values.length - 1], range: [2, w - 4] });
  const max = Math.max(...pts.map((p) => p.v));
  const min = Math.min(0, ...pts.map((p) => p.v));
  const y = scaleLinear({ domain: [min, max || 1], range: [h - 3, 3] });
  const last = pts[pts.length - 1];
  return (
    <svg
      width='100%'
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio='none'
      aria-hidden
      className='overflow-visible'
    >
      <AreaClosed
        data={pts}
        x={(p) => x(p.i)}
        y={(p) => y(p.v)}
        yScale={y}
        curve={curveLinear}
        fill='var(--viz-s1)'
        fillOpacity={0.1}
      />
      <LinePath
        data={pts}
        x={(p) => x(p.i)}
        y={(p) => y(p.v)}
        curve={curveLinear}
        stroke='var(--viz-s1)'
        strokeWidth={1.5}
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
      />
      <circle
        cx={x(last.i)}
        cy={y(last.v)}
        r={2.5}
        fill='var(--viz-s1)'
        stroke='var(--viz-surface)'
        strokeWidth={1.5}
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  );
};

interface TileDef {
  key: keyof Pick<
    IStatisticsKpis,
    | 'loans'
    | 'active_readers'
    | 'utilization'
    | 'hold_fulfillment'
    | 'median_wait_hours'
  >;
  fmt: (v: number | null) => string;
  /** Is an increase good news? Drives the delta's color, never its sign. */
  upIsGood: boolean;
  /**
   * How the change is stated honestly:
   * - `count`: absolute difference while the base is small (3 → 13 is "+10", not "+333 %"), relative above that;
   * - `points`: ratios change in percentage points (3 % → 1 % is "−2 pp", not "−66 %");
   * - `relative`: plain relative change.
   */
  delta: 'count' | 'points' | 'relative';
}

const TILES: TileDef[] = [
  { key: 'loans', fmt: fmtCount, upIsGood: true, delta: 'count' },
  { key: 'active_readers', fmt: fmtCount, upIsGood: true, delta: 'count' },
  {
    key: 'utilization',
    fmt: (v) => fmtPct(v),
    upIsGood: true,
    delta: 'points',
  },
  {
    key: 'hold_fulfillment',
    fmt: (v) => fmtPct(v),
    upIsGood: true,
    delta: 'points',
  },
  {
    key: 'median_wait_hours',
    fmt: fmtHours,
    upIsGood: false,
    delta: 'relative',
  },
];

/** Below this previous-period count a percentage change is mostly noise. */
const SMALL_BASE = 20;

const Delta = ({
  kpi,
  upIsGood,
  kind,
}: {
  kpi: IKpi;
  upIsGood: boolean;
  kind: TileDef['delta'];
}) => {
  const { t } = useTranslation();
  const d = relDelta(kpi.value, kpi.previous);
  if (kind === 'points' && kpi.value != null && kpi.previous != null) {
    const pp = (kpi.value - kpi.previous) * 100;
    return (
      <DeltaText
        sign={Math.abs(pp) < 0.05 ? 0 : Math.sign(pp)}
        upIsGood={upIsGood}
        text={`${Math.abs(pp).toFixed(1)} ${t('administration.dashboard.kpi.points')}`}
      />
    );
  }
  if (
    kind === 'count' &&
    kpi.value != null &&
    kpi.previous != null &&
    kpi.previous < SMALL_BASE
  ) {
    const diff = kpi.value - kpi.previous;
    return (
      <DeltaText
        sign={Math.sign(diff)}
        upIsGood={upIsGood}
        text={fmtCount(Math.abs(diff))}
      />
    );
  }
  if (d == null)
    return (
      <span className='text-xs text-zinc-400'>
        {t('administration.dashboard.kpi.noComparison')}
      </span>
    );
  const flat = Math.abs(d) < 0.005;
  return (
    <DeltaText
      sign={flat ? 0 : Math.sign(d)}
      upIsGood={upIsGood}
      text={`${Math.abs(d * 100).toFixed(0)} %`}
    />
  );
};

/** Signed change with arrow; color = direction × whether up is good. `text` is the unsigned magnitude. */
const DeltaText = ({
  sign,
  upIsGood,
  text,
}: {
  sign: number;
  upIsGood: boolean;
  text: string;
}) => {
  const { t } = useTranslation();
  const good = sign === 0 ? null : sign > 0 === upIsGood;
  const color =
    good == null
      ? 'text-zinc-500 dark:text-zinc-400'
      : good
        ? 'text-[color:var(--viz-good-text)]'
        : 'text-[color:var(--viz-critical-text)]';
  return (
    <span className='text-xs leading-tight'>
      <span
        className={`inline-flex items-center gap-0.5 whitespace-nowrap font-semibold ${color}`}
      >
        {sign > 0 && <FiArrowUpRight size={13} aria-hidden />}
        {sign < 0 && <FiArrowDownRight size={13} aria-hidden />}
        {sign === 0
          ? `±${text.replace(/^[\d.,]+/, '0')}`
          : `${sign > 0 ? '+' : '−'}${text}`}
      </span>{' '}
      <span className='text-zinc-400 dark:text-zinc-500'>
        {t('administration.dashboard.kpi.vsPrevious')}
      </span>
    </span>
  );
};

/** `partial[i]` marks series buckets cut by the range edges; their trend points are left out of sparklines. */
const KpiTiles = ({
  kpis,
  partial,
}: {
  kpis: IStatisticsKpis;
  partial: boolean[];
}) => {
  const { t } = useTranslation();
  return (
    <div className='viz-root grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'>
      {TILES.map(({ key, fmt, upIsGood, delta }) => {
        const kpi = kpis[key];
        return (
          <div
            key={key}
            className='flex flex-col justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800'
            title={t(`administration.dashboard.kpi.${key}.help`)}
          >
            <div>
              <div className='text-sm font-medium text-zinc-600 dark:text-zinc-300'>
                {t(`administration.dashboard.kpi.${key}.label`)}
              </div>
              <div className='mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50'>
                {fmt(kpi.value)}
              </div>
              {key === 'utilization' && (
                <div className='text-xs text-zinc-500 dark:text-zinc-400'>
                  {t('administration.dashboard.kpi.utilization.now', {
                    inUse: fmtCount(kpis.copies_in_use_now),
                    total: fmtCount(kpis.copies_total),
                  })}
                </div>
              )}
            </div>
            <Sparkline
              values={kpi.trend.map((v, i) => (partial[i] ? null : v))}
            />
            <Delta kpi={kpi} upIsGood={upIsGood} kind={delta} />
          </div>
        );
      })}
    </div>
  );
};

export default KpiTiles;
