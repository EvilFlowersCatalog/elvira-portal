import { useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { scaleSqrt } from '@visx/scale';
import { ILibraryMap } from '../../../utils/interfaces/graph';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { forceLayout } from '../../../utils/func/forceLayout';
import { ChartCard, Responsive, TooltipBox } from './ChartCard';
import { fmtCount, fmtPct, needsCopies } from './format';
import { SemanticIndex } from './semantic';

const HEIGHT = 420;
const PAD = 22;

type Lens = 'all' | 'hot' | 'dormant';

const SEQ = [
  'var(--viz-seq-1)',
  'var(--viz-seq-2)',
  'var(--viz-seq-3)',
  'var(--viz-seq-4)',
];
/** Utilization → one of four ramp steps (≤25 %, ≤50 %, ≤80 %, above). */
const step = (u: number) => (u <= 0.25 ? 0 : u <= 0.5 ? 1 : u <= 0.8 ? 2 : 3);

interface Placed {
  id: string;
  title: string;
  x: number;
  y: number;
  stats: ITitleStatistics | null;
}

const Canvas = ({
  map,
  stats,
  width,
  lens,
  periodFrom,
  highlight,
  onHover,
  onOpen,
}: {
  map: ILibraryMap;
  stats: Map<string, ITitleStatistics>;
  width: number;
  lens: Lens;
  periodFrom: string;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? highlight;
  const from = useMemo(() => parseISO(periodFrom), [periodFrom]);

  const maxLoans = Math.max(1, ...[...stats.values()].map((d) => d.loans));
  const r = scaleSqrt({ domain: [0, maxLoans], range: [5, 14] });
  const radius = (s: ITitleStatistics | null) => (s ? r(s.loans) : 3);

  // Deterministic force layout (same engine as Explore); LCP titles get more room since they carry the data.
  const layout = useMemo(() => {
    const pos = forceLayout(
      map.nodes.map((n) => ({ id: n.id, r: stats.has(n.id) ? 10 : 5 })),
      map.edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.score,
      }))
    );
    return map.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      ...pos.get(n.id)!,
    }));
  }, [map, stats]);

  const placed: Placed[] = useMemo(() => {
    const xs = layout.map((n) => n.x);
    const ys = layout.map((n) => n.y);
    const [minX, maxX, minY, maxY] = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ];
    const k = Math.min(
      (width - PAD * 2) / (maxX - minX || 1),
      (HEIGHT - PAD * 2) / (maxY - minY || 1)
    );
    const ox = (width - (maxX - minX) * k) / 2;
    const oy = (HEIGHT - (maxY - minY) * k) / 2;
    return layout.map((n) => ({
      id: n.id,
      title: n.title,
      x: (n.x - minX) * k + ox,
      y: (n.y - minY) * k + oy,
      stats: stats.get(n.id) ?? null,
    }));
  }, [layout, width, stats]);
  const byId = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed]);

  const isDormant = (s: ITitleStatistics) =>
    s.loans === 0 && parseISO(s.added_at) < from;

  // Lens: keep the matching titles and their direct neighbours lit — the neighbourhood is the point.
  const focus = useMemo(() => {
    const seeds = new Set<string>();
    if (active) seeds.add(active);
    else if (lens !== 'all')
      stats.forEach((s, id) => {
        const dormant = s.loans === 0 && parseISO(s.added_at) < from;
        if (lens === 'hot' ? needsCopies(s) || s.queued > 0 : dormant)
          seeds.add(id);
      });
    if (!seeds.size) return lens === 'all' || active ? null : new Set<string>();
    const lit = new Set(seeds);
    map.edges.forEach((e) => {
      if (seeds.has(e.source)) lit.add(e.target);
      if (seeds.has(e.target)) lit.add(e.source);
    });
    return lit;
  }, [active, lens, stats, map.edges, from]);

  const hovered = active ? byId.get(active) : undefined;
  const enter = (id: string | null) => {
    setHover(id);
    onHover(id);
  };

  return (
    <div className='relative'>
      <svg
        width={width}
        height={HEIGHT}
        role='img'
        aria-label={t('administration.dashboard.map.aria')}
        className='block select-none'
        onPointerLeave={() => enter(null)}
      >
        <g>
          {map.edges.map((e) => {
            const a = byId.get(e.source);
            const b = byId.get(e.target);
            if (!a || !b) return null;
            const lit = focus ? focus.has(a.id) && focus.has(b.id) : true;
            const touchesActive =
              active && (a.id === active || b.id === active);
            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={touchesActive ? 'var(--viz-ink-2)' : 'var(--viz-axis)'}
                strokeWidth={touchesActive ? 1.5 : 1}
                strokeOpacity={lit ? 0.6 : 0.12}
              />
            );
          })}
        </g>
        {/* Open titles first so LCP marks sit on top. */}
        {[...placed]
          .sort((a, b) => Number(!!a.stats) - Number(!!b.stats))
          .map((p) => {
            const s = p.stats;
            const rad = radius(s);
            const dim = focus ? !focus.has(p.id) : false;
            const dormant = s ? isDormant(s) : false;
            return (
              <g
                key={p.id}
                role='button'
                tabIndex={s ? 0 : -1}
                aria-label={p.title}
                className='cursor-pointer outline-none'
                opacity={dim ? 0.15 : 1}
                onPointerEnter={() => enter(p.id)}
                onFocus={() => enter(p.id)}
                onBlur={() => enter(null)}
                onClick={() => onOpen(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(p.id);
                  }
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(rad + 4, 9)}
                  fill='transparent'
                />
                {s && s.queued > 0 && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={rad + 3.5}
                    fill='none'
                    stroke='var(--viz-s2)'
                    strokeWidth={2}
                  />
                )}
                {s ? (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={rad}
                    fill={
                      dormant || s.loans === 0
                        ? 'var(--viz-surface)'
                        : SEQ[step(s.utilization)]
                    }
                    stroke={
                      dormant || s.loans === 0
                        ? 'var(--viz-seq-3)'
                        : 'var(--viz-surface)'
                    }
                    strokeWidth={dormant || s.loans === 0 ? 1.5 : 2}
                    strokeDasharray={dormant ? '3 2' : undefined}
                  />
                ) : (
                  <circle cx={p.x} cy={p.y} r={rad} fill='var(--viz-axis)' />
                )}
                {active === p.id && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={rad + (s?.queued ? 6.5 : 3.5)}
                    fill='none'
                    stroke='var(--viz-ink)'
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}
      </svg>
      {hovered && hover && (
        <div
          className='pointer-events-none absolute z-20'
          style={{
            left: Math.min(Math.max(hovered.x + 14, 8), width - 220),
            top: hovered.y > HEIGHT - 120 ? hovered.y - 110 : hovered.y + 14,
          }}
        >
          <TooltipBox
            title={hovered.title}
            rows={
              hovered.stats
                ? [
                    {
                      label: t(
                        'administration.dashboard.demand.tt.utilization'
                      ),
                      value: fmtPct(hovered.stats.utilization),
                    },
                    {
                      label: t('administration.dashboard.demand.tt.loans'),
                      value: fmtCount(hovered.stats.loans),
                    },
                    {
                      label: t('administration.dashboard.demand.tt.waiting', {
                        copies: hovered.stats.copies,
                      }),
                      value: fmtCount(hovered.stats.queued),
                    },
                  ]
                : [
                    {
                      label: t('administration.dashboard.map.openTitle'),
                      value: t('administration.dashboard.map.openValue'),
                    },
                  ]
            }
            footer={t('administration.dashboard.map.clickToInspect')}
          />
        </div>
      )}
    </div>
  );
};

/**
 * "Where in the library is the demand?" — the meaning-graph from /explore with lending painted on:
 * neighbours are publications about the same thing, so a busy title's neighbourhood is where to
 * point waiting readers, and a dormant title in a busy neighbourhood is a promotion candidate.
 */
export default function DemandMap({
  map,
  semantic,
  titles,
  periodFrom,
  highlight,
  onHover,
  onOpen,
  onTrack,
}: {
  map: ILibraryMap;
  semantic: SemanticIndex;
  titles: ITitleStatistics[];
  periodFrom: string;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onTrack: (what: string) => void;
}) {
  const { t } = useTranslation();
  const k = 'administration.dashboard.map';
  const [lens, setLens] = useState<Lens>('all');
  const stats = useMemo(
    () => new Map(titles.map((d) => [d.entry_id, d])),
    [titles]
  );

  const lent = semantic.topics.filter((r) => r.lcpTitles > 0);
  const topTopic = [...lent].sort((a, b) => b.loans - a.loans)[0];
  const queuedTopic = [...lent].sort((a, b) => b.queued - a.queued)[0];

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      insight={
        topTopic && topTopic.loans > 0
          ? [
              t(`${k}.insight`, {
                topic: t(`explore.classes.${topTopic.cls}`),
                loans: topTopic.loans,
                titles: topTopic.lcpTitles,
              }),
              queuedTopic && queuedTopic.queued > 0
                ? t(`${k}.insightQueue`, {
                    topic: t(`explore.classes.${queuedTopic.cls}`),
                    count: queuedTopic.queued,
                  })
                : '',
            ].join(' ')
          : undefined
      }
      table={{
        columns: [
          t(`${k}.col.topic`),
          t(`${k}.col.titles`),
          t(`${k}.col.lcp`),
          t('administration.dashboard.col.loans'),
          t('administration.dashboard.col.inUse'),
          t('administration.dashboard.col.waiting'),
          t(`${k}.col.dormant`),
        ],
        rows: semantic.topics.map((r) => [
          t(`explore.classes.${r.cls}`),
          r.titles,
          r.lcpTitles,
          r.loans,
          `${r.inUse}/${r.copies}`,
          r.queued,
          r.dormant,
        ]),
      }}
    >
      <div
        className='mb-2 flex flex-wrap items-center gap-1.5'
        role='radiogroup'
        aria-label={t(`${k}.lens.label`)}
      >
        {(['all', 'hot', 'dormant'] as Lens[]).map((l) => (
          <button
            key={l}
            type='button'
            role='radio'
            aria-checked={lens === l}
            onClick={() => {
              setLens(l);
              onTrack(`map-lens-${l}`);
            }}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              lens === l
                ? 'border-zinc-500 bg-zinc-100 font-semibold text-zinc-900 dark:border-zinc-400 dark:bg-zinc-700 dark:text-zinc-50'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700/50'
            }`}
          >
            {t(`${k}.lens.${l}`)}
          </button>
        ))}
        <span className='ml-auto text-xs text-zinc-500 dark:text-zinc-400'>
          {t(`${k}.coverage`, {
            covered: semantic.covered,
            total: titles.length,
            nodes: map.nodes.length,
          })}
        </span>
      </div>
      <div className='overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-700'>
        <Responsive>
          {(width) => (
            <Canvas
              map={map}
              stats={stats}
              width={width}
              lens={lens}
              periodFrom={periodFrom}
              highlight={highlight}
              onHover={onHover}
              onOpen={onOpen}
            />
          )}
        </Responsive>
      </div>
      <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300'>
        <span className='flex items-center gap-1'>
          {t(`${k}.legend.utilization`)}
          {SEQ.map((c) => (
            <span
              key={c}
              className='h-2.5 w-4 rounded-sm'
              style={{ background: c }}
            />
          ))}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-3 w-3 rounded-full border-2 border-[color:var(--viz-s2)]' />
          {t(`${k}.legend.queue`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-3 w-3 rounded-full border border-dashed border-[color:var(--viz-seq-3)]' />
          {t(`${k}.legend.dormant`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2 w-2 rounded-full bg-[color:var(--viz-axis)]' />
          {t(`${k}.legend.open`)}
        </span>
        <span className='text-zinc-500 dark:text-zinc-400'>
          {t(`${k}.legend.size`)}
        </span>
      </div>
    </ChartCard>
  );
}
