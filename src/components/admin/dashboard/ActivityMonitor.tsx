import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, type Locale } from 'date-fns';
import { scaleLinear, scaleTime } from '@visx/scale';
import { Group } from '@visx/group';
import { Area, AreaClosed, LinePath } from '@visx/shape';
// Straight segments: a smoothed curve invents values between buckets.
import { curveLinear } from '@visx/curve';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Brush, type Bounds, type BrushProps } from '@visx/brush';
import { localPoint } from '@visx/event';
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiClock,
  FiLayers,
  FiLink2,
} from 'react-icons/fi';
import {
  IAdminStatistics,
  StatsBucket,
} from '../../../utils/interfaces/statistics';
import { ChartCard, Responsive, TooltipBox } from './ChartCard';
import { dateLocale, fmtCount, fmtHours, fmtPct, relDelta } from './format';
import {
  anomalies,
  Anomaly,
  buildMetrics,
  comovements,
  elapsedShare,
  expectation,
  Expectation,
  indexed,
  Metric,
  MetricKey,
} from './trendModel';

/**
 * Identity per metric, fixed whatever is switched on. Only three hues validate as lines, so the
 * rest carry identity by dash pattern in neutral ink.
 */
const META: Record<
  MetricKey,
  { color: string; dash?: string }
> = {
  loans_started: { color: 'var(--viz-s1)' },
  holds_placed: { color: 'var(--viz-s2)' },
  active_readers: { color: 'var(--viz-s3)' },
  visitors: { color: 'var(--viz-ink-2)' },
  reads: { color: 'var(--viz-ink-2)', dash: '6 3' },
  loans_returned: { color: 'var(--viz-muted)', dash: '2 3' },
  utilization: { color: 'var(--viz-ink-2)', dash: '1 3' },
  hold_fulfillment: { color: 'var(--viz-muted)', dash: '6 3' },
  median_wait_hours: { color: 'var(--viz-muted)', dash: '1 3' },
};

const DEFAULT_ON: MetricKey[] = [
  'visitors',
  'active_readers',
  'loans_started',
  'holds_placed',
  'reads',
];

type Mode = 'panels' | 'compare';

const LEFT = 44;
const RIGHT = 56;
const PANEL_H = 92;
const AXIS_H = 24;
const COMPARE_H = 280;
const BRUSH_H = 44;

const fmtValue = (m: Metric['kind'], v: number | null | undefined) =>
  v == null ? '—' : m === 'ratio' ? fmtPct(v) : m === 'hours' ? fmtHours(v) : fmtCount(v);

const tickFmt = (bucket: StatsBucket, locale: Locale) => (d: Date) =>
  format(d, bucket === 'month' ? 'LLL yy' : 'd. M.', { locale });
interface Prepared {
  metric: Metric;
  exp: Expectation;
  peaks: Anomaly[];
}

/** One metric on its own scale, sharing the time axis and crosshair with the panels around it. */
const Panel = ({
  p,
  dates,
  partial,
  x,
  range,
  width,
  hover,
  last,
  projection,
  bucket,
  locale,
  onHover,
}: {
  p: Prepared;
  dates: Date[];
  partial: boolean[];
  x: (d: Date) => number;
  range: [number, number];
  width: number;
  hover: number | null;
  last: boolean;
  projection: number | null;
  bucket: StatsBucket;
  locale: Locale;
  onHover: (i: number | null) => void;
}) => {
  const { t } = useTranslation();
  const { metric, exp, peaks } = p;
  const meta = META[metric.key];
  const iw = Math.max(0, width - LEFT - RIGHT);
  const h = PANEL_H + (last ? AXIS_H : 0);
  const idx: number[] = [];
  for (let i = range[0]; i <= range[1]; i += 1) idx.push(i);
  const pts = idx.filter((i) => metric.values[i] != null);
  const complete = pts.filter((i) => !partial[i]);
  const top = Math.max(
    metric.kind === 'ratio' ? 0.1 : 4,
    ...pts.map((i) => metric.values[i]!),
    ...idx.map((i) => exp.hi[i] ?? 0),
    projection ?? 0
  );
  // Top 22 px stay free for the panel header.
  const y = scaleLinear({ domain: [0, top], range: [PANEL_H - 8, 22], nice: true });
  const yv = (i: number) => y(metric.values[i]!);
  const band = idx.filter((i) => exp.lo[i] != null && !partial[i]);
  const shownPeaks = peaks.filter((a) => a.index >= range[0] && a.index <= range[1]);
  const lastIdx = pts[pts.length - 1];
  const lastComplete = complete[complete.length - 1];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const pt = localPoint(e);
    if (!pt) return;
    const at = pt.x - LEFT;
    let best = idx[0];
    idx.forEach((i) => {
      if (Math.abs(x(dates[i]) - at) < Math.abs(x(dates[best]) - at)) best = i;
    });
    onHover(best);
  };

  return (
    <svg width={width} height={h} className='block overflow-visible'>
      <Group left={LEFT}>
        <GridRows scale={y} width={iw} numTicks={2} stroke='var(--viz-grid)' />
        <line x1={0} x2={iw} y1={PANEL_H - 8} y2={PANEL_H - 8} stroke='var(--viz-axis)' />
        {/* Expected range: where the value usually is for this point in the week/period. */}
        {exp.enough && band.length > 1 && (
          <>
            <Area<number>
              data={band}
              x={(i) => x(dates[i])}
              y0={(i) => y(exp.lo[i]!)}
              y1={(i) => y(exp.hi[i]!)}
              curve={curveLinear}
              fill={meta.color}
              fillOpacity={0.1}
            />
            <LinePath<number>
              data={band}
              x={(i) => x(dates[i])}
              y={(i) => y(exp.expected[i]!)}
              curve={curveLinear}
              stroke={meta.color}
              strokeOpacity={0.45}
              strokeWidth={1}
              strokeDasharray='2 3'
            />
          </>
        )}
        {complete.length > 1 && metric.kind === 'count' && (
          <AreaClosed<number>
            data={complete}
            x={(i) => x(dates[i])}
            y={yv}
            yScale={y}
            curve={curveLinear}
            fill={meta.color}
            fillOpacity={0.06}
          />
        )}
        {/* The bucket in progress: faded, never read as a crash. */}
        {lastIdx !== undefined && lastComplete !== undefined && lastIdx !== lastComplete && (
          <line
            x1={x(dates[lastComplete])}
            y1={yv(lastComplete)}
            x2={x(dates[lastIdx])}
            y2={yv(lastIdx)}
            stroke={meta.color}
            strokeOpacity={0.3}
            strokeWidth={2}
            strokeDasharray='3 3'
          />
        )}
        <LinePath<number>
          data={complete}
          x={(i) => x(dates[i])}
          y={yv}
          curve={curveLinear}
          stroke={meta.color}
          strokeWidth={2}
          strokeDasharray={meta.dash}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        {/* Run-rate: where the bucket in progress lands at its current pace. */}
        {projection != null && lastIdx !== undefined && partial[lastIdx] && (
          <g>
            <line
              x1={x(dates[lastIdx])}
              x2={x(dates[lastIdx])}
              y1={yv(lastIdx)}
              y2={y(projection)}
              stroke={meta.color}
              strokeOpacity={0.5}
              strokeDasharray='2 2'
            />
            <circle
              cx={x(dates[lastIdx])}
              cy={y(projection)}
              r={4}
              fill='var(--viz-surface)'
              stroke={meta.color}
              strokeWidth={1.5}
            />
            <text
              x={x(dates[lastIdx]) + 7}
              y={y(projection) + 3}
              fontSize={10}
              fill='var(--viz-ink-2)'
              className='tabular-nums'
            >
              {t('administration.dashboard.monitor.pace', { value: fmtCount(projection) })}
            </text>
          </g>
        )}
        {shownPeaks.map((a, n) => {
          const cx = x(dates[a.index]);
          const cy = y(a.value);
          return (
            <g key={a.index}>
              <circle cx={cx} cy={cy} r={5} fill={a.kind === 'peak' ? meta.color : 'var(--viz-surface)'} stroke={a.kind === 'peak' ? 'var(--viz-surface)' : meta.color} strokeWidth={2} />
              {/* Label only the strongest one per panel: a number on every mark goes unread. */}
              {n === 0 && (
                <text
                  x={Math.min(cx, iw - 40)}
                  y={a.kind === 'peak' ? cy - 9 : cy + 16}
                  fontSize={10}
                  fontWeight={600}
                  fill='var(--viz-ink)'
                  textAnchor='middle'
                  className='tabular-nums'
                >
                  {a.kind === 'peak' ? '▲' : '▼'} {fmtValue(metric.kind, a.value)}
                </text>
              )}
            </g>
          );
        })}
        {hover != null && metric.values[hover] != null && (
          <g pointerEvents='none'>
            <line x1={x(dates[hover])} x2={x(dates[hover])} y1={0} y2={PANEL_H - 8} stroke='var(--viz-ink-2)' strokeOpacity={0.5} />
            <circle cx={x(dates[hover])} cy={yv(hover)} r={4} fill={meta.color} stroke='var(--viz-surface)' strokeWidth={2} />
          </g>
        )}
        {hover != null && metric.values[hover] == null && (
          <line x1={x(dates[hover])} x2={x(dates[hover])} y1={0} y2={PANEL_H - 8} stroke='var(--viz-ink-2)' strokeOpacity={0.5} pointerEvents='none' />
        )}
        <AxisLeft
          scale={y}
          numTicks={2}
          stroke='transparent'
          tickStroke='transparent'
          tickFormat={(v) => fmtValue(metric.kind, Number(v))}
          tickLabelProps={{ fill: 'var(--viz-muted)', fontSize: 10, className: 'tabular-nums' }}
        />
        {last && (
          <AxisBottom
            top={PANEL_H - 8}
            scale={scaleTime({ domain: [dates[range[0]], dates[range[1]]], range: [0, iw] })}
            numTicks={Math.max(2, Math.min(8, Math.floor(iw / 90)))}
            stroke='transparent'
            tickStroke='transparent'
            tickFormat={(v) => tickFmt(bucket, locale)(v as Date)}
            tickLabelProps={{ fill: 'var(--viz-muted)', fontSize: 11, className: 'tabular-nums' }}
          />
        )}
        <rect
          width={iw}
          height={PANEL_H}
          fill='transparent'
          onPointerMove={onMove}
          onPointerLeave={() => onHover(null)}
        />
      </Group>
    </svg>
  );
};

/** Every selected metric divided by its own period average: one axis, 100 = a normal bucket. */
const Compare = ({
  prepared,
  dates,
  partial,
  x,
  range,
  width,
  hover,
  focus,
  bucket,
  locale,
  onHover,
}: {
  prepared: Prepared[];
  dates: Date[];
  partial: boolean[];
  x: (d: Date) => number;
  range: [number, number];
  width: number;
  hover: number | null;
  focus: MetricKey | null;
  bucket: StatsBucket;
  locale: Locale;
  onHover: (i: number | null) => void;
}) => {
  const { t } = useTranslation();
  const iw = Math.max(0, width - LEFT - RIGHT);
  const ih = COMPARE_H - AXIS_H - 8;
  const idx: number[] = [];
  for (let i = range[0]; i <= range[1]; i += 1) idx.push(i);
  const lines = prepared.map((p) => ({ p, v: indexed(p.metric.values, partial) }));
  const top = Math.max(
    150,
    ...lines.flatMap((l) => idx.map((i) => l.v[i] ?? 0))
  );
  const y = scaleLinear({ domain: [0, top], range: [ih, 6], nice: true });
  // Highlight at most three: the focused one, or the first three that carry a hue.
  const lit = (k: MetricKey) => (focus ? focus === k : true);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const pt = localPoint(e);
    if (!pt) return;
    const at = pt.x - LEFT;
    let best = idx[0];
    idx.forEach((i) => {
      if (Math.abs(x(dates[i]) - at) < Math.abs(x(dates[best]) - at)) best = i;
    });
    onHover(best);
  };

  return (
    <svg width={width} height={COMPARE_H} role='img' aria-label={t('administration.dashboard.monitor.compareAria')}>
      <Group left={LEFT} top={2}>
        <GridRows scale={y} width={iw} numTicks={4} stroke='var(--viz-grid)' />
        <line x1={0} x2={iw} y1={y(100)} y2={y(100)} stroke='var(--viz-ink-2)' strokeOpacity={0.6} />
        <text x={iw + 4} y={y(100) + 3} fontSize={10} fill='var(--viz-ink-2)'>
          {t('administration.dashboard.monitor.average')}
        </text>
        {lines.map(({ p, v }) => {
          const pts = idx.filter((i) => v[i] != null && !partial[i]);
          const meta = META[p.metric.key];
          const on = lit(p.metric.key);
          return (
            <LinePath<number>
              key={p.metric.key}
              data={pts}
              x={(i) => x(dates[i])}
              y={(i) => y(v[i]!)}
              curve={curveLinear}
              stroke={on ? meta.color : 'var(--viz-axis)'}
              strokeOpacity={on ? 1 : 0.7}
              strokeWidth={on ? 2.25 : 1.25}
              strokeDasharray={meta.dash}
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          );
        })}
        {hover != null && (
          <g pointerEvents='none'>
            <line x1={x(dates[hover])} x2={x(dates[hover])} y1={0} y2={ih} stroke='var(--viz-ink-2)' strokeOpacity={0.5} />
            {lines.map(({ p, v }) =>
              v[hover] == null ? null : (
                <circle key={p.metric.key} cx={x(dates[hover])} cy={y(v[hover]!)} r={3.5} fill={META[p.metric.key].color} stroke='var(--viz-surface)' strokeWidth={2} />
              )
            )}
          </g>
        )}
        <AxisLeft
          scale={y}
          numTicks={4}
          stroke='transparent'
          tickStroke='transparent'
          tickFormat={(v) => `${Number(v)}`}
          tickLabelProps={{ fill: 'var(--viz-muted)', fontSize: 10, className: 'tabular-nums' }}
        />
        <AxisBottom
          top={ih}
          scale={scaleTime({ domain: [dates[range[0]], dates[range[1]]], range: [0, iw] })}
          numTicks={Math.max(2, Math.min(8, Math.floor(iw / 90)))}
          stroke='var(--viz-axis)'
          tickStroke='transparent'
          tickFormat={(v) => tickFmt(bucket, locale)(v as Date)}
          tickLabelProps={{ fill: 'var(--viz-muted)', fontSize: 11, className: 'tabular-nums' }}
        />
        <rect width={iw} height={ih} fill='transparent' onPointerMove={onMove} onPointerLeave={() => onHover(null)} />
      </Group>
    </svg>
  );
};

/**
 * "How is the library used over time?" — every activity signal on one shared timeline: visitors,
 * readers, loans, holds, reads. Stacked panels give each its own scale (never two y-axes on one
 * plot); Compare puts them on one axis as "% of a normal bucket" to show what moves together.
 * Each panel carries its expected range (same weekday, other weeks), marks real peaks and dips,
 * and projects the bucket in progress at its current pace.
 */
export default function ActivityMonitor({
  data,
  onTrack,
}: {
  data: IAdminStatistics;
  onTrack: (what: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const k = 'administration.dashboard.monitor';
  const locale = dateLocale(i18n.language);
  const bucket = data.period.bucket;
  const [mode, setMode] = useState<Mode>('panels');
  const [on, setOn] = useState<MetricKey[]>(DEFAULT_ON);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [focus, setFocus] = useState<MetricKey | null>(null);
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const brushRef = useRef(null) as NonNullable<BrushProps['innerRef']>;

  const dates = useMemo(() => data.series.map((b) => parseISO(b.t)), [data.series]);
  const partial = useMemo(() => data.series.map((b) => b.partial), [data.series]);
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const prepared: Prepared[] = useMemo(
    () =>
      metrics.map((metric) => {
        const exp = expectation(metric.values, data.series.map((b) => b.t), partial, bucket, metric.kind);
        return { metric, exp, peaks: anomalies(metric, exp, partial) };
      }),
    [metrics, data.series, partial, bucket]
  );
  const byKey = new Map(prepared.map((p) => [p.metric.key, p]));
  const shown = prepared.filter((p) => p.metric.available && on.includes(p.metric.key));
  const missing = prepared.filter((p) => !p.metric.available);
  const co = useMemo(() => comovements(metrics, partial), [metrics, partial]);

  const n = data.series.length;
  const last = data.series[n - 1];
  const share = last
    ? elapsedShare(last.t, bucket, last.partial, data.generated_at, data.period.to)
    : null;
  const projectionOf = (m: Metric) =>
    share && m.kind === 'count' && m.values[n - 1] != null
      ? m.values[n - 1]! / share
      : null;
  const range: [number, number] = zoom ?? [0, Math.max(0, n - 1)];
  const at = hover ?? pinned;

  const allPeaks = prepared
    .filter((p) => p.metric.available && p.metric.kind === 'count')
    .flatMap((p) => p.peaks)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  // One entry per period: a busy day shows up in every measure at once, and should read as one event.
  const events = [...new Set(allPeaks.map((a) => a.index))]
    .slice(0, 4)
    .map((index) => ({ index, items: allPeaks.filter((a) => a.index === index) }));
  const enoughForBands = prepared.some((p) => p.metric.available && p.exp.enough);
  const loans = byKey.get('loans_started')!.metric;
  const loansProjection = projectionOf(loans);

  const toggle = (key: MetricKey) => {
    onTrack(`monitor-metric-${key}`);
    setOn((v) =>
      v.includes(key) ? (v.length > 1 ? v.filter((x) => x !== key) : v) : [...v, key]
    );
  };
  const label = (key: MetricKey) => t(`${k}.metric.${key}`);
  const when = (i: number) => format(dates[i], bucket === 'month' ? 'LLLL yyyy' : 'd. M. yyyy', { locale });

  const lagText = (c: (typeof co)[number]) => {
    if (c.lag === 0) return t(`${k}.together`, { a: label(c.a), b: label(c.b) });
    const [first, then] = c.lag > 0 ? [c.a, c.b] : [c.b, c.a];
    return t(`${k}.leads_${bucket}`, { a: label(first), b: label(then), count: Math.abs(c.lag) });
  };

  const insight = [
    loansProjection != null &&
      t(`${k}.insightPace_${bucket}`, {
        so: fmtCount(loans.values[n - 1]),
        pace: fmtCount(loansProjection),
      }),
    allPeaks[0] &&
      t(`${k}.insightPeak`, {
        metric: label(allPeaks[0].metric),
        date: when(allPeaks[0].index),
        value: fmtCount(allPeaks[0].value),
        expected: fmtCount(allPeaks[0].expected),
      }),
    co[0] && lagText(co[0]),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      insight={insight || undefined}
      table={{
        columns: [
          t('administration.dashboard.col.period'),
          ...prepared.filter((p) => p.metric.available).flatMap((p) => [label(p.metric.key), `${label(p.metric.key)} · ${t(`${k}.expected`)}`]),
        ],
        rows: data.series.map((b, i) => [
          `${b.t}${b.partial ? ` (${t('administration.dashboard.trend.partial')})` : ''}`,
          ...prepared
            .filter((p) => p.metric.available)
            .flatMap((p) => [
              fmtValue(p.metric.kind, p.metric.values[i]),
              p.exp.expected[i] == null ? '—' : fmtValue(p.metric.kind, p.exp.expected[i]),
            ]),
        ]),
      }}
    >
      {/* Controls: what to show, and how. */}
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <div role='group' aria-label={t(`${k}.metrics`)} className='flex flex-wrap gap-1.5'>
          {prepared.map(({ metric }) => {
            const active = metric.available && on.includes(metric.key);
            const meta = META[metric.key];
            return (
              <button
                key={metric.key}
                type='button'
                aria-pressed={active}
                disabled={!metric.available}
                title={metric.available ? undefined : t(`${k}.notCollected`)}
                onClick={() => toggle(metric.key)}
                onPointerEnter={() => mode === 'compare' && setFocus(metric.key)}
                onPointerLeave={() => setFocus(null)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                  !metric.available
                    ? 'cursor-not-allowed border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'
                    : active
                      ? 'border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700/50'
                }`}
              >
                <svg width={14} height={4} aria-hidden>
                  <line x1={1} x2={13} y1={2} y2={2} stroke={active ? meta.color : 'var(--viz-axis)'} strokeWidth={2} strokeDasharray={meta.dash ? '3 2' : undefined} strokeLinecap='round' />
                </svg>
                {label(metric.key)}
                {!metric.available && <span className='text-[10px] uppercase tracking-wide'>· {t(`${k}.soon`)}</span>}
              </button>
            );
          })}
        </div>
        <div role='radiogroup' aria-label={t(`${k}.mode.label`)} className='ml-auto inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700'>
          {(['panels', 'compare'] as Mode[]).map((m) => (
            <button
              key={m}
              type='button'
              role='radio'
              aria-checked={mode === m}
              onClick={() => {
                setMode(m);
                onTrack(`monitor-mode-${m}`);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                mode === m
                  ? 'bg-secondary text-white dark:bg-secondaryLight dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {m === 'panels' ? <FiLayers size={13} /> : <FiBarChart2 size={13} />}
              {t(`${k}.mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='min-w-0'>
          <Responsive>
            {(width) => {
              const iw = Math.max(0, width - LEFT - RIGHT);
              const x = scaleTime({ domain: [dates[range[0]], dates[range[1]]], range: [0, iw] });
              const bx = scaleTime({ domain: [dates[0], dates[n - 1]], range: [0, iw] });
              const by = scaleLinear({ domain: [0, Math.max(1, ...loans.values.map((v) => v ?? 0))], range: [BRUSH_H - 4, 4] });
              return (
                <div className='relative' key={`${bucket}-${data.series[0]?.t}-${n}`}>
                  {mode === 'panels' ? (
                    <div className='divide-y divide-zinc-100 dark:divide-zinc-700/60'>
                      {shown.map((p, i) => {
                        const v = at != null ? p.metric.values[at] : null;
                        const delta = relDelta(p.metric.total, p.metric.previous);
                        return (
                          <div key={p.metric.key} className='relative pt-1'>
                            {/* Panel header: what, how much, compared to last period. */}
                            <div className='pointer-events-none absolute left-11 top-1 z-10 flex items-baseline gap-2 text-xs'>
                              <span className='font-semibold text-zinc-800 dark:text-zinc-100'>{label(p.metric.key)}</span>
                              <span className='tabular-nums text-zinc-500 dark:text-zinc-400'>
                                {at != null
                                  ? `${when(at)}: ${fmtValue(p.metric.kind, v)}${p.exp.expected[at] != null ? ` · ${t(`${k}.expected`)} ${fmtValue(p.metric.kind, p.exp.expected[at])}` : ''}`
                                  : p.metric.total != null
                                    ? `${t(`${k}.period`)}: ${fmtValue(p.metric.kind, p.metric.total)}`
                                    : ''}
                              </span>
                              {at == null && delta != null && (
                                <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${delta >= 0 ? 'text-[color:var(--viz-good-text)]' : 'text-[color:var(--viz-critical-text)]'}`}>
                                  {delta >= 0 ? <FiArrowUpRight size={11} /> : <FiArrowDownRight size={11} />}
                                  {fmtPct(Math.abs(delta))}
                                </span>
                              )}
                            </div>
                            <Panel
                              p={p}
                              dates={dates}
                              partial={partial}
                              x={x}
                              range={range}
                              width={width}
                              hover={at}
                              last={i === shown.length - 1}
                              projection={projectionOf(p.metric)}
                              bucket={bucket}
                              locale={locale}
                              onHover={setHover}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <Compare
                        prepared={shown}
                        dates={dates}
                        partial={partial}
                        x={x}
                        range={range}
                        width={width}
                        hover={at}
                        focus={focus}
                        bucket={bucket}
                        locale={locale}
                        onHover={setHover}
                      />
                      {at != null && (
                        <div className='pointer-events-none absolute right-16 top-2 z-10'>
                          <TooltipBox
                            title={when(at)}
                            rows={shown.map((p) => ({
                              label: label(p.metric.key),
                              value: `${fmtValue(p.metric.kind, p.metric.values[at])} · ${indexed(p.metric.values, partial)[at]?.toFixed(0) ?? '—'}`,
                              color: META[p.metric.key].color,
                            }))}
                            footer={t(`${k}.indexHelp`)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {n > 12 && (
                    <div className='mt-2'>
                      <svg width={width} height={BRUSH_H} aria-hidden>
                        <Group left={LEFT}>
                          <rect width={iw} height={BRUSH_H} rx={4} fill='var(--viz-seq-0)' fillOpacity={0.6} />
                          <AreaClosed<number>
                            data={loans.values.map((_, i) => i)}
                            x={(i) => bx(dates[i])}
                            y={(i) => by(loans.values[i] ?? 0)}
                            yScale={by}
                            curve={curveLinear}
                            fill='var(--viz-s1)'
                            fillOpacity={0.25}
                            stroke='var(--viz-s1)'
                            strokeWidth={1}
                          />
                          <Brush
                            xScale={bx}
                            yScale={by}
                            width={iw}
                            height={BRUSH_H}
                            margin={{ left: LEFT }}
                            handleSize={8}
                            resizeTriggerAreas={['left', 'right']}
                            brushDirection='horizontal'
                            innerRef={brushRef}
                            onChange={(b: Bounds | null) => {
                              if (!b) return setZoom(null);
                              const inside = dates.map((d, i) => [d.getTime(), i] as const).filter(([ts]) => ts >= b.x0 && ts <= b.x1).map(([, i]) => i);
                              setZoom(inside.length >= 2 ? [inside[0], inside[inside.length - 1]] : null);
                            }}
                            selectedBoxStyle={{ fill: 'var(--viz-s1)', fillOpacity: 0.12, stroke: 'var(--viz-s1)', strokeWidth: 1 }}
                            useWindowMoveEvents
                          />
                        </Group>
                      </svg>
                      <div className='mt-1 flex items-center gap-3 pl-11 text-[11px] text-zinc-400'>
                        <span>{t('administration.dashboard.trend.brushHint')}</span>
                        {zoom && (
                          <button
                            type='button'
                            onClick={() => {
                              brushRef.current?.reset();
                              setZoom(null);
                            }}
                            className='font-semibold text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                          >
                            {t('administration.dashboard.trend.resetZoom')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </Responsive>
          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-11 text-xs text-zinc-500 dark:text-zinc-400'>
            {mode === 'panels' ? (
              <>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2.5 w-4 rounded-sm bg-[color:var(--viz-s1)] opacity-20' />
                  {t(`${k}.legend.band`)}
                </span>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-s1)] ring-2 ring-[color:var(--viz-surface)]' />
                  {t(`${k}.legend.peak`)}
                </span>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2.5 w-2.5 rounded-full border-[1.5px] border-[color:var(--viz-s1)]' />
                  {t(`${k}.legend.pace`)}
                </span>
                {!enoughForBands && <span>{t(`${k}.notEnough`)}</span>}
              </>
            ) : (
              <span>{t(`${k}.indexHelp`)}</span>
            )}
          </div>
        </div>

        {/* Highlights: what the lines say, in sentences. */}
        <aside className='space-y-4 text-sm' aria-label={t(`${k}.highlights`)}>
          {loansProjection != null && (
            <section>
              <h4 className='mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                <FiClock size={13} /> {t(`${k}.paceTitle`)}
              </h4>
              <p className='text-zinc-700 dark:text-zinc-200'>
                {t(`${k}.paceBody_${bucket}`, {
                  so: fmtCount(loans.values[n - 1]),
                  pace: fmtCount(loansProjection),
                  share: fmtPct(share),
                })}
              </p>
            </section>
          )}
          <section>
            <h4 className='mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
              <FiActivity size={13} /> {t(`${k}.peaksTitle`)}
            </h4>
            {events.length === 0 ? (
              <p className='text-zinc-500 dark:text-zinc-400'>
                {enoughForBands ? t(`${k}.noPeaks`) : t(`${k}.notEnough`)}
              </p>
            ) : (
              <ul className='space-y-1'>
                {events.map(({ index, items }) => (
                  <li key={index}>
                    <button
                      type='button'
                      onClick={() => {
                        onTrack('monitor-peak');
                        setPinned(pinned === index ? null : index);
                      }}
                      onPointerEnter={() => setHover(index)}
                      onPointerLeave={() => setHover(null)}
                      aria-pressed={pinned === index}
                      className={`w-full rounded-md px-2 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/40 ${pinned === index ? 'bg-zinc-100 dark:bg-zinc-700/60' : ''}`}
                    >
                      <span className='flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-100'>
                        <span className='text-zinc-500' aria-hidden>
                          {items[0].kind === 'peak' ? '▲' : '▼'}
                        </span>
                        {when(index)}
                      </span>
                      {items.map((a) => (
                        <span key={a.metric} className='flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
                          <span className='h-0.5 w-2.5 shrink-0 rounded-full' style={{ background: META[a.metric].color }} />
                          {t(`${k}.${a.kind}`, {
                            metric: label(a.metric),
                            value: fmtCount(a.value),
                            expected: fmtCount(a.expected),
                          })}
                        </span>
                      ))}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h4 className='mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
              <FiLink2 size={13} /> {t(`${k}.coTitle`)}
            </h4>
            {co.length === 0 ? (
              <p className='text-zinc-500 dark:text-zinc-400'>
                {n - 1 < 8 ? t(`${k}.coTooShort`) : t(`${k}.coNone`)}
              </p>
            ) : (
              <ul className='space-y-1.5'>
                {co.slice(0, 3).map((c) => (
                  <li
                    key={`${c.a}-${c.b}`}
                    className='text-zinc-700 dark:text-zinc-200'
                    title={t(`${k}.coStats`, { r: c.r.toFixed(2), n: c.pairs })}
                  >
                    {lagText(c)}{' '}
                    <span className='text-xs text-zinc-400'>
                      {Math.abs(c.r) >= 0.8 ? t(`${k}.strong`) : t(`${k}.moderate`)}
                      {c.r < 0 ? ` · ${t(`${k}.opposite`)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className='mt-1 text-[11px] text-zinc-400'>{t(`${k}.coCaveat`)}</p>
          </section>
          {missing.length > 0 && (
            <p className='rounded-md border border-dashed border-zinc-200 px-2.5 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'>
              {t(`${k}.missing`, { metrics: missing.map((p) => label(p.metric.key)).join(', ') })}
            </p>
          )}
        </aside>
      </div>
    </ChartCard>
  );
}
