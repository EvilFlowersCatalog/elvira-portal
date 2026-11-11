import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, type Locale } from 'date-fns';
import { scaleLinear, scaleTime } from '@visx/scale';
import { Group } from '@visx/group';
import { AreaClosed, LinePath } from '@visx/shape';
// Straight segments: a smoothed curve invents values between buckets (one busy day became a bell).
import { curveLinear } from '@visx/curve';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Brush, type Bounds, type BrushProps } from '@visx/brush';
import { localPoint } from '@visx/event';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import {
  IStatisticsBucket,
  StatsBucket,
} from '../../../utils/interfaces/statistics';
import { ChartCard, Legend, Responsive, TooltipBox } from './ChartCard';
import { dateLocale, fmtCount, tooltipStyle } from './format';

interface Point extends IStatisticsBucket {
  date: Date;
}

const SERIES = [
  { key: 'loans_started', color: 'var(--viz-s1)' },
  { key: 'holds_placed', color: 'var(--viz-s2)' },
] as const;

const M = { top: 12, right: 28, bottom: 28, left: 40 };
const MAIN_H = 260;
const BRUSH_H = 52;

const tickFmt = (bucket: StatsBucket, locale: Locale) => (d: Date) =>
  format(d, bucket === 'month' ? 'LLL yy' : 'd. M.', { locale });
const tooltipDateFmt: Record<StatsBucket, string> = {
  day: 'EEEE d. M. yyyy',
  week: "'≥' d. M. yyyy",
  month: 'LLLL yyyy',
};
const getDate = (p: Point) => p.date;
const nearest = (pts: Point[], at: Date) =>
  pts.reduce((best, p) =>
    Math.abs(p.date.getTime() - at.getTime()) <
    Math.abs(best.date.getTime() - at.getTime())
      ? p
      : best
  );
const maxOf = (pts: Point[], f: (p: Point) => number) =>
  pts.reduce((m, p) => Math.max(m, f(p)), 0);

const Chart = ({
  data,
  width,
  bucket,
}: {
  data: Point[];
  width: number;
  bucket: StatsBucket;
}) => {
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n.language);
  const [window_, setWindow] = useState<Point[] | null>(null);
  const brushRef = useRef(null) as NonNullable<BrushProps['innerRef']>;
  const resetZoom = () => {
    brushRef.current?.reset();
    setWindow(null);
  };
  const shown = window_ && window_.length >= 2 ? window_ : data;
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<Point>();

  const iw = Math.max(0, width - M.left - M.right);
  const ih = MAIN_H - M.top - M.bottom;
  const withBrush = data.length > 12;

  const x = useMemo(
    () =>
      scaleTime({
        domain: [shown[0].date, shown[shown.length - 1].date],
        range: [0, iw],
      }),
    [shown, iw]
  );
  // Floor of 4 keeps ticks on whole numbers when counts are tiny.
  const yMax = Math.max(
    4,
    maxOf(shown, (p) => Math.max(p.loans_started, p.holds_placed))
  );
  const y = useMemo(
    () => scaleLinear({ domain: [0, yMax], range: [ih, 0], nice: true }),
    [yMax, ih]
  );

  const bx = useMemo(
    () =>
      scaleTime({
        domain: [data[0].date, data[data.length - 1].date],
        range: [0, iw],
      }),
    [data, iw]
  );
  const by = useMemo(
    () =>
      scaleLinear({
        domain: [0, maxOf(data, (p) => p.loans_started) || 1],
        range: [BRUSH_H - 4, 2],
      }),
    [data]
  );

  const onBrush = (b: Bounds | null) => {
    if (!b) return setWindow(null);
    setWindow(
      data.filter((p) => p.date.getTime() >= b.x0 && p.date.getTime() <= b.x1)
    );
  };

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const pt = localPoint(e);
    if (!pt) return;
    const d = nearest(shown, x.invert(pt.x - M.left));
    showTooltip({
      tooltipData: d,
      tooltipLeft: x(d.date) + M.left,
      tooltipTop: y(d.loans_started) + M.top,
    });
  };

  // Partial buckets (cut by the range edges) are drawn faded so a half-finished month doesn't read as a crash.
  const complete = shown.filter((p) => !p.partial);
  const last = complete[complete.length - 1] ?? shown[shown.length - 1];

  return (
    <div className='relative'>
      <svg
        width={width}
        height={MAIN_H}
        role='img'
        aria-label={t('administration.dashboard.trend.aria')}
      >
        <Group left={M.left} top={M.top}>
          <GridRows
            scale={y}
            width={iw}
            numTicks={4}
            stroke='var(--viz-grid)'
          />
          <AreaClosed<Point>
            data={complete}
            x={(p) => x(getDate(p))}
            y={(p) => y(p.loans_started)}
            yScale={y}
            curve={curveLinear}
            fill='var(--viz-s1)'
            fillOpacity={0.1}
          />
          {SERIES.map((s) => (
            <g key={s.key}>
              {complete.length < shown.length && (
                <LinePath<Point>
                  data={shown}
                  x={(p) => x(getDate(p))}
                  y={(p) => y(p[s.key])}
                  curve={curveLinear}
                  stroke={s.color}
                  strokeOpacity={0.3}
                  strokeWidth={2}
                  strokeLinecap='round'
                />
              )}
              <LinePath<Point>
                data={complete}
                x={(p) => x(getDate(p))}
                y={(p) => y(p[s.key])}
                curve={curveLinear}
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </g>
          ))}
          {/* End label on the lead series only. */}
          <circle
            cx={x(last.date)}
            cy={y(last.loans_started)}
            r={4}
            fill='var(--viz-s1)'
            stroke='var(--viz-surface)'
            strokeWidth={2}
          />
          {tooltipData && (
            <g pointerEvents='none'>
              <line
                x1={x(tooltipData.date)}
                x2={x(tooltipData.date)}
                y1={0}
                y2={ih}
                stroke='var(--viz-axis)'
              />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={x(tooltipData.date)}
                  cy={y(tooltipData[s.key])}
                  r={4}
                  fill={s.color}
                  stroke='var(--viz-surface)'
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
          <AxisLeft
            scale={y}
            numTicks={4}
            stroke='transparent'
            tickStroke='transparent'
            tickFormat={(v) => fmtCount(Number(v))}
            tickLabelProps={{
              fill: 'var(--viz-muted)',
              fontSize: 11,
              className: 'tabular-nums',
            }}
          />
          <AxisBottom
            top={ih}
            scale={x}
            numTicks={Math.max(2, Math.min(7, Math.floor(iw / 90)))}
            stroke='var(--viz-axis)'
            tickStroke='transparent'
            tickFormat={(v) => tickFmt(bucket, locale)(v as Date)}
            tickLabelProps={{
              fill: 'var(--viz-muted)',
              fontSize: 11,
              className: 'tabular-nums',
            }}
          />
          <rect
            width={iw}
            height={ih}
            fill='transparent'
            onPointerMove={onMove}
            onPointerLeave={hideTooltip}
          />
        </Group>
      </svg>

      {withBrush && (
        <div className='mt-1'>
          <svg width={width} height={BRUSH_H} aria-hidden>
            <Group left={M.left}>
              <rect
                width={iw}
                height={BRUSH_H}
                rx={4}
                fill='var(--viz-seq-0)'
                fillOpacity={0.6}
              />
              <AreaClosed<Point>
                data={data}
                x={(p) => bx(getDate(p))}
                y={(p) => by(p.loans_started)}
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
                margin={{ left: M.left }}
                handleSize={8}
                resizeTriggerAreas={['left', 'right']}
                brushDirection='horizontal'
                innerRef={brushRef}
                onChange={onBrush}
                selectedBoxStyle={{
                  fill: 'var(--viz-s1)',
                  fillOpacity: 0.12,
                  stroke: 'var(--viz-s1)',
                  strokeWidth: 1,
                }}
                useWindowMoveEvents
              />
            </Group>
          </svg>
          <div className='mt-1 flex items-center gap-3 text-[11px] text-zinc-400'>
            <span>{t('administration.dashboard.trend.brushHint')}</span>
            {window_ && (
              <button
                type='button'
                onClick={resetZoom}
                className='font-semibold text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
              >
                {t('administration.dashboard.trend.resetZoom')}
              </button>
            )}
          </div>
        </div>
      )}

      {tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          unstyled
          applyPositionStyle
          style={tooltipStyle}
          offsetLeft={14}
        >
          <TooltipBox
            title={`${format(tooltipData.date, tooltipDateFmt[bucket], { locale })}${tooltipData.partial ? ` · ${t('administration.dashboard.trend.partial')}` : ''}`}
            rows={[
              {
                label: t('administration.dashboard.trend.loansStarted'),
                value: fmtCount(tooltipData.loans_started),
                color: 'var(--viz-s1)',
              },
              {
                label: t('administration.dashboard.trend.holdsPlaced'),
                value: fmtCount(tooltipData.holds_placed),
                color: 'var(--viz-s2)',
              },
              {
                label: t('administration.dashboard.trend.returned'),
                value: fmtCount(tooltipData.loans_returned),
              },
              {
                label: t('administration.dashboard.trend.expired'),
                value: fmtCount(tooltipData.loans_expired),
              },
            ]}
          />
        </TooltipWithBounds>
      )}
    </div>
  );
};

const LendingTrend = ({
  series,
  bucket,
}: {
  series: IStatisticsBucket[];
  bucket: StatsBucket;
}) => {
  const { t, i18n } = useTranslation();
  const data = useMemo(
    () => series.map((b) => ({ ...b, date: parseISO(b.t) })),
    [series]
  );
  const peak = data
    .filter((p) => !p.partial)
    .reduce<Point | null>(
      (m, p) => (!m || p.loans_started > m.loans_started ? p : m),
      null
    );

  return (
    <ChartCard
      title={t('administration.dashboard.trend.title')}
      description={t('administration.dashboard.trend.description')}
      insight={
        peak && peak.loans_started > 0
          ? t('administration.dashboard.trend.insight', {
              date: format(
                peak.date,
                bucket === 'month' ? 'LLLL yyyy' : 'd. M. yyyy',
                { locale: dateLocale(i18n.language) }
              ),
              count: peak.loans_started,
            })
          : undefined
      }
      table={{
        columns: [
          t('administration.dashboard.col.period'),
          t('administration.dashboard.trend.loansStarted'),
          t('administration.dashboard.trend.holdsPlaced'),
          t('administration.dashboard.trend.returned'),
          t('administration.dashboard.trend.expired'),
        ],
        rows: data.map((p) => [
          p.t,
          p.loans_started,
          p.holds_placed,
          p.loans_returned,
          p.loans_expired,
        ]),
      }}
    >
      {data.length < 2 ||
      data.every((p) => p.loans_started === 0 && p.holds_placed === 0) ? (
        <p className='py-8 text-center text-sm text-zinc-500'>
          {t('administration.dashboard.empty')}
        </p>
      ) : (
        <>
          {/* Keyed on the slice so a new range drops any zoom window and brush selection. */}
          <Responsive>
            {(width) => (
              <Chart
                key={`${bucket}-${series[0].t}-${series.length}`}
                data={data}
                width={width}
                bucket={bucket}
              />
            )}
          </Responsive>
          <div className='mt-2'>
            <Legend
              items={[
                {
                  label: t('administration.dashboard.trend.loansStarted'),
                  color: 'var(--viz-s1)',
                  shape: 'line',
                },
                {
                  label: t('administration.dashboard.trend.holdsPlaced'),
                  color: 'var(--viz-s2)',
                  shape: 'line',
                },
              ]}
            />
          </div>
        </>
      )}
    </ChartCard>
  );
};

export default LendingTrend;
