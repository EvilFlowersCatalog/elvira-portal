import { useMemo, useState } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  FiAlertOctagon,
  FiBookOpen,
  FiCheckCircle,
  FiCornerUpRight,
  FiMoon,
} from 'react-icons/fi';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { forceLayout } from '../../../utils/func/forceLayout';
import { ChartCard } from './ChartCard';
import {
  HoodStatus,
  isUnused,
  Neighbourhood,
  SemanticIndex,
  SubjectNames,
} from './semantic';

const W = 240;
const H = 120;
const PAD = 12;

/** Status = good/warning/critical semantics, so status tokens (always with icon + label). */
const HOOD_STYLE: Record<
  HoodStatus,
  { icon: typeof FiCheckCircle; badge: string }
> = {
  short: {
    icon: FiAlertOctagon,
    badge:
      'bg-red-50 text-[color:var(--viz-critical-text)] dark:bg-red-950/40',
  },
  redirect: {
    icon: FiCornerUpRight,
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  },
  lending: {
    icon: FiCheckCircle,
    badge:
      'bg-green-50 text-[color:var(--viz-good-text)] dark:bg-green-950/40',
  },
  quiet: {
    icon: FiMoon,
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-300',
  },
  open: {
    icon: FiBookOpen,
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-300',
  },
};

/**
 * A neighbourhood is named after the subject most of it shares; a genuinely mixed one after the
 * two subjects it bridges, or failing that, as mixed (its central title then says what it is about).
 */
const hoodName = (
  h: Neighbourhood,
  names: SubjectNames,
  t: TFunction
): string => {
  const [a, b] = h.terms;
  if (!a) return t('administration.dashboard.hoods.mixed');
  if (a.count / h.members.length >= 0.5 || !b) return names.label(a.term);
  if (b.count >= 2) return `${names.label(a.term)} & ${names.label(b.term)}`;
  return t('administration.dashboard.hoods.mixed');
};

type Mark = 'waiting' | 'lent' | 'unused' | 'idle' | 'open';
const markOf = (s: ITitleStatistics | undefined, periodFrom: string): Mark =>
  !s
    ? 'open'
    : s.queued > 0
      ? 'waiting'
      : s.loans > 0
        ? 'lent'
        : isUnused(s, periodFrom)
          ? 'unused'
          : 'idle';

const MiniGraph = ({
  hood,
  semantic,
  stats,
  periodFrom,
  highlight,
  onHover,
  onOpen,
}: {
  hood: Neighbourhood;
  semantic: SemanticIndex;
  stats: Map<string, ITitleStatistics>;
  periodFrom: string;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const placed = useMemo(() => {
    const pos = forceLayout(
      hood.members.map((id) => ({ id, r: stats.has(id) ? 9 : 5 })),
      hood.edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.score,
      })),
      200
    );
    const pts = hood.members.map((id) => ({ id, ...pos.get(id)! }));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const [x0, x1, y0, y1] = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ];
    // Never blow a pair up to fill the tile: cap the zoom so spacing reads the same across tiles.
    const k = Math.min(
      (W - PAD * 2) / (x1 - x0 || 1),
      (H - PAD * 2) / (y1 - y0 || 1),
      1.6
    );
    const ox = (W - (x1 - x0) * k) / 2;
    const oy = (H - (y1 - y0) * k) / 2;
    return new Map(
      pts.map((p) => [p.id, { x: (p.x - x0) * k + ox, y: (p.y - y0) * k + oy }])
    );
  }, [hood, stats]);

  const maxLoans = Math.max(1, ...hood.members.map((id) => stats.get(id)?.loans ?? 0));
  const radius = (s?: ITitleStatistics) =>
    s ? 4.5 + 3.5 * Math.sqrt(s.loans / maxLoans) : 3;

  // LCP titles last so they sit on top of the free ones.
  const order = [...hood.members].sort(
    (a, b) => Number(stats.has(a)) - Number(stats.has(b))
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className='block h-auto w-full'
      role='group'
      aria-label={t('administration.dashboard.hoods.graphAria', {
        count: hood.members.length,
      })}
    >
      {hood.edges.map((e) => {
        const a = placed.get(e.source)!;
        const b = placed.get(e.target)!;
        const lit = highlight === e.source || highlight === e.target;
        return (
          <line
            key={`${e.source}-${e.target}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={lit ? 'var(--viz-ink-2)' : 'var(--viz-axis)'}
            strokeWidth={lit ? 1.5 : 1}
          />
        );
      })}
      {order.map((id) => {
        const p = placed.get(id)!;
        const s = stats.get(id);
        const mark = markOf(s, periodFrom);
        const r = radius(s);
        const title = semantic.nodes.get(id)?.title ?? '';
        return (
          <g
            key={id}
            role='button'
            tabIndex={s ? 0 : -1}
            aria-label={`${title} — ${t(`administration.dashboard.hoods.mark.${mark}`)}`}
            className='cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-[color:var(--viz-ink)]'
            onPointerEnter={() => onHover(id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(id)}
            onBlur={() => onHover(null)}
            onClick={() => onOpen(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(id);
              }
            }}
          >
            <title>
              {title}
              {s
                ? ` — ${t('administration.dashboard.hoods.tt', {
                    loans: s.loans,
                    inUse: s.in_use,
                    copies: s.copies,
                    queued: s.queued,
                  })}`
                : ` — ${t('administration.dashboard.hoods.mark.open')}`}
            </title>
            {/* Generous invisible hit target. */}
            <circle cx={p.x} cy={p.y} r={Math.max(r + 5, 10)} fill='transparent' />
            {mark === 'open' ? (
              <circle cx={p.x} cy={p.y} r={r} fill='var(--viz-axis)' />
            ) : mark === 'unused' || mark === 'idle' ? (
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill='var(--viz-surface)'
                stroke='var(--viz-ink-2)'
                strokeWidth={1.5}
                strokeDasharray={mark === 'unused' ? '2.5 1.5' : undefined}
              />
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={mark === 'waiting' ? 'var(--viz-s2)' : 'var(--viz-s1)'}
                stroke='var(--viz-surface)'
                strokeWidth={2}
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={r + 3}
              fill='none'
              stroke={highlight === id ? 'var(--viz-ink)' : 'transparent'}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
    </svg>
  );
};

const Tile = ({
  hood,
  ...rest
}: {
  hood: Neighbourhood;
  semantic: SemanticIndex;
  names: SubjectNames;
  stats: Map<string, ITitleStatistics>;
  periodFrom: string;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const k = 'administration.dashboard.hoods';
  const [listOpen, setListOpen] = useState(false);
  const style = HOOD_STYLE[hood.status];
  const Icon = style.icon;
  const central = rest.semantic.nodes.get(hood.central)?.title ?? '';
  const members = [...hood.members].sort(
    (a, b) =>
      (rest.stats.get(b)?.queued ?? -1) - (rest.stats.get(a)?.queued ?? -1) ||
      (rest.stats.get(b)?.loans ?? -1) - (rest.stats.get(a)?.loans ?? -1)
  );
  const facts = [
    hood.queued > 0 && t(`${k}.fact.waiting`, { count: hood.queued }),
    hood.copies > 0 &&
      t(`${k}.fact.spare`, { count: hood.spare, copies: hood.copies }),
    hood.openTitles > 0 && t(`${k}.fact.open`, { count: hood.openTitles }),
    hood.loans > 0 && t(`${k}.fact.loans`, { count: hood.loans }),
  ].filter(Boolean) as string[];

  return (
    <article className='flex flex-col rounded-lg border border-zinc-200 p-3 dark:border-zinc-700'>
      <header className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <h4 className='truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
            {hoodName(hood, rest.names, t)}
          </h4>
          {/* Two tiles can share a subject name; the central title is what tells them apart. */}
          <p
            className='line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300'
            title={central}
          >
            {t(`${k}.around`, { title: central })}
          </p>
          <p className='text-[11px] text-zinc-500 dark:text-zinc-400'>
            {t(`${k}.size`, { count: hood.members.length })}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
        >
          <Icon size={12} aria-hidden />
          {t(`${k}.status.${hood.status}`)}
        </span>
      </header>
      <div className='my-1'>
        <MiniGraph hood={hood} {...rest} />
      </div>
      <p className='text-xs tabular-nums text-zinc-600 dark:text-zinc-300'>
        {facts.join(' · ')}
      </p>
      <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
        {t(`${k}.advice.${hood.status}`, { count: hood.unused })}
      </p>
      <button
        type='button'
        aria-expanded={listOpen}
        onClick={() => setListOpen((v) => !v)}
        className='mt-2 self-start text-xs font-medium text-primaryText hover:underline dark:text-primaryLight'
      >
        {listOpen ? t(`${k}.hideTitles`) : t(`${k}.showTitles`, { count: hood.members.length })}
      </button>
      {listOpen && (
        <ul className='mt-1 max-h-48 divide-y divide-zinc-100 overflow-auto dark:divide-zinc-700'>
          {members.map((id) => {
            const s = rest.stats.get(id);
            return (
              <li key={id}>
                <button
                  type='button'
                  onClick={() => rest.onOpen(id)}
                  onPointerEnter={() => rest.onHover(id)}
                  onPointerLeave={() => rest.onHover(null)}
                  className='flex w-full items-baseline gap-2 py-1 text-left text-xs'
                >
                  <span className='min-w-0 flex-1 truncate text-zinc-800 hover:underline dark:text-zinc-100'>
                    {rest.semantic.nodes.get(id)?.title}
                  </span>
                  <span className='shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400'>
                    {s
                      ? t(`${k}.row`, { inUse: s.in_use, copies: s.copies, queued: s.queued })
                      : t(`${k}.mark.open`)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};

/**
 * "Where can waiting readers be sent?" — the library graph cut into neighbourhoods (Louvain
 * communities: publications about the same thing, so readers can substitute one for another),
 * drawn as small multiples instead of one hairball. Each tile says how much pressure its group
 * is under and what relieves it; tiles are ordered by urgency.
 */
export default function Neighbourhoods({
  semantic,
  names,
  titles,
  periodFrom,
  highlight,
  onHover,
  onOpen,
  onTrack,
}: {
  semantic: SemanticIndex;
  names: SubjectNames;
  titles: ITitleStatistics[];
  periodFrom: string;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onTrack: (what: string) => void;
}) {
  const { t } = useTranslation();
  const k = 'administration.dashboard.hoods';
  const [showOpen, setShowOpen] = useState(false);
  const stats = useMemo(
    () => new Map(titles.map((d) => [d.entry_id, d])),
    [titles]
  );
  const licensed = semantic.neighbourhoods.filter((h) => h.status !== 'open');
  const openOnly = semantic.neighbourhoods.filter((h) => h.status === 'open');
  const count = (s: HoodStatus) =>
    semantic.neighbourhoods.filter((h) => h.status === s).length;
  const lonelyLcp = semantic.loners.filter((id) => stats.has(id));

  const tileProps = {
    semantic,
    names,
    stats,
    periodFrom,
    highlight,
    onHover,
    onOpen,
  };

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      insight={[
        count('short') > 0 &&
          t(`${k}.insightShort`, { count: count('short') }),
        count('redirect') > 0 &&
          t(`${k}.insightRedirect`, { count: count('redirect') }),
        count('short') + count('redirect') === 0 && t(`${k}.insightCalm`),
        semantic.loners.length > 0 &&
          t(`${k}.insightLoners`, {
            count: semantic.loners.length,
            lcp: lonelyLcp.length,
          }),
      ]
        .filter(Boolean)
        .join(' ')}
      table={{
        columns: [
          t(`${k}.col.name`),
          t(`${k}.col.around`),
          t(`${k}.col.status`),
          t(`${k}.col.publications`),
          t(`${k}.col.lcp`),
          t(`${k}.col.open`),
          t('administration.dashboard.col.inUse'),
          t('administration.dashboard.col.waiting'),
          t('administration.dashboard.col.loans'),
          t(`${k}.col.unused`),
        ],
        rows: semantic.neighbourhoods.map((h) => [
          hoodName(h, names, t),
          semantic.nodes.get(h.central)?.title ?? '',
          t(`${k}.status.${h.status}`),
          h.members.length,
          h.lcpTitles,
          h.openTitles,
          `${h.inUse}/${h.copies}`,
          h.queued,
          h.loans,
          h.unused,
        ]),
      }}
    >
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {licensed.map((h) => (
          <Tile key={h.id} hood={h} {...tileProps} />
        ))}
        {showOpen &&
          openOnly.map((h) => <Tile key={h.id} hood={h} {...tileProps} />)}
        {semantic.loners.length > 0 && (
          <article className='flex flex-col rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600'>
            <h4 className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
              {t(`${k}.loners.title`, { count: semantic.loners.length })}
            </h4>
            <p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
              {t(`${k}.loners.body`)}
            </p>
            {lonelyLcp.length > 0 ? (
              <ul className='mt-2 divide-y divide-zinc-100 dark:divide-zinc-700'>
                {lonelyLcp.map((id) => {
                  const s = stats.get(id)!;
                  return (
                    <li key={id}>
                      <button
                        type='button'
                        onClick={() => onOpen(id)}
                        onPointerEnter={() => onHover(id)}
                        onPointerLeave={() => onHover(null)}
                        className='flex w-full items-baseline gap-2 py-1 text-left text-xs'
                      >
                        <span className='min-w-0 flex-1 truncate text-zinc-800 hover:underline dark:text-zinc-100'>
                          {s.title}
                        </span>
                        <span className='shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400'>
                          {t(`${k}.row`, { inUse: s.in_use, copies: s.copies, queued: s.queued })}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className='mt-2 text-xs text-zinc-500'>
                {t(`${k}.loners.noLcp`)}
              </p>
            )}
          </article>
        )}
      </div>
      {openOnly.length > 0 && (
        <button
          type='button'
          aria-expanded={showOpen}
          onClick={() => {
            setShowOpen((v) => !v);
            onTrack('hoods-open');
          }}
          className='mt-3 text-xs font-medium text-primaryText hover:underline dark:text-primaryLight'
        >
          {showOpen
            ? t(`${k}.hideOpen`)
            : t(`${k}.showOpen`, {
                count: openOnly.length,
                titles: openOnly.reduce((s, h) => s + h.members.length, 0),
              })}
        </button>
      )}
      <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300'>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-s2)]' />
          {t(`${k}.mark.waiting`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[color:var(--viz-s1)]' />
          {t(`${k}.mark.lent`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full border border-dashed border-[color:var(--viz-ink-2)]' />
          {t(`${k}.mark.unused`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full border border-[color:var(--viz-ink-2)]' />
          {t(`${k}.mark.idle`)}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2 w-2 rounded-full bg-[color:var(--viz-axis)]' />
          {t(`${k}.mark.open`)}
        </span>
        <span className='text-zinc-500 dark:text-zinc-400'>
          {t(`${k}.legendSize`)}
        </span>
      </div>
    </ChartCard>
  );
}
