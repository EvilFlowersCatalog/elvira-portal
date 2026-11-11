import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scaleLinear, scaleSqrt } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { voronoi } from '@visx/voronoi';
import { localPoint } from '@visx/event';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { ChartCard, Legend, Responsive, TooltipBox } from './ChartCard';
import { fmtCount, fmtPct, fmtRatio, tooltipStyle } from './format';

/** A title needs copies when it is busy AND more people wait than there are copies. */
const UTIL_THRESHOLD = 0.8;
const HOLDS_THRESHOLD = 1;
const needsCopies = (t: ITitleStatistics) =>
  t.utilization >= UTIL_THRESHOLD && t.holds_ratio >= HOLDS_THRESHOLD;

const M = { top: 12, right: 16, bottom: 46, left: 40 };
const HEIGHT = 340;

const truncate = (s: string, n = 26) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

interface ChartProps {
  titles: ITitleStatistics[];
  width: number;
  onOpen: (entryId: string) => void;
}

const QuadrantChart = ({ titles, width, onOpen }: ChartProps) => {
  const { t } = useTranslation();
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ITitleStatistics>();
  const [hover, setHover] = useState<string | null>(null);

  const iw = Math.max(0, width - M.left - M.right);
  const ih = HEIGHT - M.top - M.bottom;
  const maxRatio = Math.max(2, ...titles.map((d) => d.holds_ratio)) * 1.1;
  const maxLoans = Math.max(1, ...titles.map((d) => d.loans));

  const x = useMemo(
    () => scaleLinear({ domain: [0, 1], range: [0, iw], clamp: true }),
    [iw]
  );
  const y = useMemo(
    () => scaleLinear({ domain: [0, maxRatio], range: [ih, 0], nice: true }),
    [ih, maxRatio]
  );
  const r = useMemo(
    () => scaleSqrt({ domain: [0, maxLoans], range: [3.5, 13] }),
    [maxLoans]
  );

  const diagram = useMemo(
    () =>
      voronoi<ITitleStatistics>({
        x: (d) => x(d.utilization),
        y: (d) => y(d.holds_ratio),
        width: iw,
        height: ih,
      })(titles),
    [titles, x, y, iw, ih]
  );

  // Direct labels only on the three most acute titles — the axis and tooltip carry the rest.
  const labelled = new Set(
    titles
      .filter(needsCopies)
      .sort((a, b) => b.holds_ratio - a.holds_ratio)
      .slice(0, 3)
      .map((d) => d.entry_id)
  );

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const p = localPoint(e);
    if (!p) return;
    const site = diagram.find(p.x - M.left, p.y - M.top, 36);
    if (!site) {
      setHover(null);
      hideTooltip();
      return;
    }
    setHover(site.data.entry_id);
    showTooltip({
      tooltipData: site.data,
      tooltipLeft: x(site.data.utilization) + M.left,
      tooltipTop: y(site.data.holds_ratio) + M.top,
    });
  };

  const qLabel = 'fill-[color:var(--viz-muted)] text-[11px] font-medium';

  return (
    <div className='relative'>
      <svg
        width={width}
        height={HEIGHT}
        role='img'
        aria-label={t('administration.dashboard.demand.aria')}
      >
        <Group left={M.left} top={M.top}>
          <GridRows
            scale={y}
            width={iw}
            numTicks={4}
            stroke='var(--viz-grid)'
          />
          <GridColumns
            scale={x}
            height={ih}
            numTicks={4}
            stroke='var(--viz-grid)'
          />
          {/* "Add copies" quadrant wash */}
          <rect
            x={x(UTIL_THRESHOLD)}
            y={0}
            width={iw - x(UTIL_THRESHOLD)}
            height={y(HOLDS_THRESHOLD)}
            fill='var(--viz-s2)'
            fillOpacity={0.06}
          />
          <line
            x1={x(UTIL_THRESHOLD)}
            x2={x(UTIL_THRESHOLD)}
            y1={0}
            y2={ih}
            stroke='var(--viz-axis)'
          />
          <line
            x1={0}
            x2={iw}
            y1={y(HOLDS_THRESHOLD)}
            y2={y(HOLDS_THRESHOLD)}
            stroke='var(--viz-axis)'
          />

          <text x={iw - 6} y={12} textAnchor='end' className={qLabel}>
            {t('administration.dashboard.demand.q.addCopies')}
          </text>
          <text x={iw - 6} y={ih - 8} textAnchor='end' className={qLabel}>
            {t('administration.dashboard.demand.q.busy')}
          </text>
          <text x={6} y={ih - 8} className={qLabel}>
            {t('administration.dashboard.demand.q.spare')}
          </text>
          <text x={6} y={12} className={qLabel}>
            {t('administration.dashboard.demand.q.checkClaims')}
          </text>

          {titles.map((d) => {
            const hot = needsCopies(d);
            const isHover = hover === d.entry_id;
            return (
              <circle
                key={d.entry_id}
                cx={x(d.utilization)}
                cy={y(d.holds_ratio)}
                r={r(d.loans) + (isHover ? 2 : 0)}
                fill={hot ? 'var(--viz-s2)' : 'var(--viz-s1)'}
                fillOpacity={hover && !isHover ? 0.3 : hot ? 0.9 : 0.65}
                stroke='var(--viz-surface)'
                strokeWidth={2}
              />
            );
          })}
          {titles
            .filter((d) => labelled.has(d.entry_id))
            .map((d) => (
              <text
                key={`l-${d.entry_id}`}
                x={x(d.utilization) - r(d.loans) - 4}
                y={y(d.holds_ratio) + 4}
                textAnchor='end'
                className='pointer-events-none fill-[color:var(--viz-ink-2)] text-[11px]'
              >
                {truncate(d.title)}
              </text>
            ))}

          <AxisLeft
            scale={y}
            numTicks={4}
            stroke='var(--viz-axis)'
            tickStroke='transparent'
            tickFormat={(v) => fmtRatio(Number(v))}
            tickLabelProps={{
              fill: 'var(--viz-muted)',
              fontSize: 11,
              className: 'tabular-nums',
            }}
            label={t('administration.dashboard.demand.yAxis')}
            labelProps={{ fill: 'var(--viz-ink-2)', fontSize: 11 }}
            labelOffset={22}
          />
          <AxisBottom
            top={ih}
            scale={x}
            numTicks={4}
            stroke='var(--viz-axis)'
            tickStroke='transparent'
            tickFormat={(v) => fmtPct(Number(v))}
            tickLabelProps={{
              fill: 'var(--viz-muted)',
              fontSize: 11,
              className: 'tabular-nums',
            }}
            label={t('administration.dashboard.demand.xAxis')}
            labelProps={{ fill: 'var(--viz-ink-2)', fontSize: 11 }}
            labelOffset={16}
          />
          <rect
            width={iw}
            height={ih}
            fill='transparent'
            className={hover ? 'cursor-pointer' : ''}
            onPointerMove={onMove}
            onPointerLeave={() => {
              setHover(null);
              hideTooltip();
            }}
            onClick={() => hover && onOpen(hover)}
          />
        </Group>
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          unstyled
          applyPositionStyle
          style={tooltipStyle}
          offsetLeft={14}
          offsetTop={-10}
        >
          <TooltipBox
            title={tooltipData.title}
            rows={[
              {
                label: t('administration.dashboard.demand.tt.utilization'),
                value: fmtPct(tooltipData.utilization),
              },
              {
                label: t('administration.dashboard.demand.tt.waiting', {
                  copies: tooltipData.copies,
                }),
                value: fmtCount(tooltipData.queued),
              },
              {
                label: t('administration.dashboard.demand.tt.loans'),
                value: fmtCount(tooltipData.loans),
              },
            ]}
            footer={t('administration.dashboard.clickToOpen')}
          />
        </TooltipWithBounds>
      )}
    </div>
  );
};

const DemandQuadrant = ({
  titles,
  onOpen,
}: {
  titles: ITitleStatistics[];
  onOpen: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const hot = titles
    .filter(needsCopies)
    .sort((a, b) => b.holds_ratio - a.holds_ratio);
  const worst = hot[0];

  return (
    <ChartCard
      title={t('administration.dashboard.demand.title')}
      description={t('administration.dashboard.demand.description')}
      insight={
        titles.length === 0
          ? undefined
          : worst
            ? t('administration.dashboard.demand.insight', {
                count: hot.length,
                title: worst.title,
                queued: worst.queued,
                copies: worst.copies,
              })
            : t('administration.dashboard.demand.insightNone')
      }
      table={{
        columns: [
          t('administration.dashboard.col.title'),
          t('administration.dashboard.col.copies'),
          t('administration.dashboard.col.inUse'),
          t('administration.dashboard.col.waiting'),
          t('administration.dashboard.col.holdsRatio'),
          t('administration.dashboard.col.utilization'),
          t('administration.dashboard.col.loans'),
          t('administration.dashboard.col.turnover'),
        ],
        rows: [...titles]
          .sort(
            (a, b) =>
              b.holds_ratio - a.holds_ratio || b.utilization - a.utilization
          )
          .map((d) => [
            d.title,
            d.copies,
            d.in_use,
            d.queued,
            fmtRatio(d.holds_ratio),
            fmtPct(d.utilization),
            d.loans,
            fmtRatio(d.turnover),
          ]),
      }}
    >
      {titles.length === 0 ? (
        <p className='py-8 text-center text-sm text-zinc-500'>
          {t('administration.dashboard.noLcpTitles')}
        </p>
      ) : (
        <Responsive>
          {(width) => (
            <QuadrantChart titles={titles} width={width} onOpen={onOpen} />
          )}
        </Responsive>
      )}
      <div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
        <Legend
          items={[
            {
              label: t('administration.dashboard.demand.legend.hot'),
              color: 'var(--viz-s2)',
              shape: 'dot',
            },
            {
              label: t('administration.dashboard.demand.legend.other'),
              color: 'var(--viz-s1)',
              shape: 'dot',
            },
          ]}
        />
        <span className='text-xs text-zinc-500 dark:text-zinc-400'>
          {t('administration.dashboard.demand.legend.size')}
        </span>
      </div>
    </ChartCard>
  );
};

export default DemandQuadrant;
