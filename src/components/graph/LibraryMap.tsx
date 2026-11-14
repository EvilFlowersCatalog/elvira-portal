import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { ILibraryMap, ILibraryMapNode } from '../../utils/interfaces/graph';
import { forceLayout } from '../../utils/func/forceLayout';
import { MarkShape, UDC_CLASS, UDC_CLASSES, UdcClass, udcClassOf } from '../../utils/func/udcClass';
import { Responsive } from '../admin/dashboard/ChartCard';

const HEIGHT = 560;
const PAD = 24;

interface PlacedNode extends ILibraryMapNode {
  cls: UdcClass;
  r: number;
  x: number;
  y: number;
}

/** Radius by page count: area grows with length, clamped so short reports stay clickable. */
const radiusFor = (pages: number | null) => Math.max(4, Math.min(13, Math.sqrt(pages ?? 80) * 0.55));

export const Mark = ({ shape, x, y, r, fill, className }: { shape: MarkShape; x: number; y: number; r: number; fill: string; className?: string }) =>
  shape === 'square' ? (
    <rect x={x - r * 0.88} y={y - r * 0.88} width={r * 1.76} height={r * 1.76} rx={1.5} fill={fill} className={className} />
  ) : (
    <circle cx={x} cy={y} r={r} fill={fill} className={className} />
  );

/** Legend swatch: the class's mark at a fixed size. */
export const Swatch = ({ cls }: { cls: UdcClass }) => {
  const def = UDC_CLASS.get(cls)!;
  return (
    <svg width={12} height={12} aria-hidden className="shrink-0">
      <Mark shape={def.shape} x={6} y={6} r={5} fill={def.color} />
    </svg>
  );
};

function MapCanvas({
  map,
  width,
  isolated,
  onOpen,
}: {
  map: ILibraryMap;
  width: number;
  isolated: UdcClass | null;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [hover, setHover] = useState<PlacedNode | null>(null);

  // Layout once per data set; resizing only rescales.
  const layout = useMemo(() => {
    const nodes = map.nodes.map((node) => ({ ...node, cls: udcClassOf(node.udc), r: radiusFor(node.pages) }));
    const positions = forceLayout(
      nodes.map((node) => ({ id: node.id, r: node.r })),
      map.edges.map((edge) => ({ source: edge.source, target: edge.target, weight: edge.score }))
    );
    return nodes.map((node) => ({ ...node, ...positions.get(node.id)! }));
  }, [map]);

  const placed = useMemo(() => {
    const xs = layout.map((n) => n.x);
    const ys = layout.map((n) => n.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const scale = Math.min((width - PAD * 2) / (maxX - minX || 1), (HEIGHT - PAD * 2) / (maxY - minY || 1));
    const offX = (width - (maxX - minX) * scale) / 2;
    const offY = (HEIGHT - (maxY - minY) * scale) / 2;
    return layout.map((n) => ({ ...n, x: (n.x - minX) * scale + offX, y: (n.y - minY) * scale + offY }));
  }, [layout, width]);

  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed]);
  const neighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover.id]);
    map.edges.forEach((e) => {
      if (e.source === hover.id) set.add(e.target);
      if (e.target === hover.id) set.add(e.source);
    });
    return set;
  }, [hover, map.edges]);

  const dimmed = (node: PlacedNode) => (isolated && node.cls !== isolated) || (neighbours && !neighbours.has(node.id));

  return (
    <div className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={t('explore.map.ariaLabel', { count: map.nodes.length })}
        className="block select-none"
        onMouseLeave={() => setHover(null)}
      >
        <g>
          {map.edges.map((edge) => {
            const a = byId.get(edge.source);
            const b = byId.get(edge.target);
            if (!a || !b) return null;
            const active = neighbours?.has(a.id) && neighbours?.has(b.id);
            const faded = (isolated && (a.cls !== isolated || b.cls !== isolated)) || (neighbours && !active);
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? 'var(--viz-ink-2)' : 'var(--viz-axis)'}
                strokeWidth={active ? 1.5 : 1}
                strokeOpacity={faded ? 0.15 : 0.35 + Math.max(0, edge.score - 0.5) * 0.9}
              />
            );
          })}
        </g>
        <g>
          {placed.map((node) => {
            const def = UDC_CLASS.get(node.cls)!;
            const label = `${node.title} — ${t(`explore.classes.${node.cls}`)}${node.pages ? `, ${t('explore.map.pages', { count: node.pages })}` : ''}`;
            return (
              <g
                key={node.id}
                role="link"
                tabIndex={0}
                aria-label={label}
                className={twMerge('cursor-pointer outline-none transition-opacity', dimmed(node) ? 'opacity-20' : 'opacity-100')}
                onMouseEnter={() => setHover(node)}
                onFocus={() => setHover(node)}
                onBlur={() => setHover(null)}
                onClick={() => onOpen(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(node.id);
                  }
                }}
              >
                {/* Hit target larger than the mark; 2px surface ring keeps overlapping marks apart. */}
                <circle cx={node.x} cy={node.y} r={Math.max(node.r + 5, 10)} fill="transparent" />
                <Mark shape={def.shape} x={node.x} y={node.y} r={node.r + 1.5} fill="var(--viz-surface)" />
                <Mark shape={def.shape} x={node.x} y={node.y} r={node.r} fill={def.color} />
                {hover?.id === node.id && (
                  <Mark shape={def.shape} x={node.x} y={node.y} r={node.r + 3} fill="none" className="stroke-[var(--viz-ink)] [stroke-width:1.5]" />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          style={{
            left: Math.min(Math.max(hover.x + 14, 8), width - 260),
            top: hover.y > HEIGHT - 90 ? hover.y - 80 : hover.y + 14,
          }}
        >
          <p className="font-semibold text-[color:var(--viz-ink)]">{hover.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[color:var(--viz-ink-2)]">
            <Swatch cls={hover.cls} />
            {t(`explore.classes.${hover.cls}`)}
            {hover.udc.length > 0 && <span className="tabular-nums">· {hover.udc.slice(0, 3).join(', ')}</span>}
          </p>
          <p className="mt-0.5 text-[color:var(--viz-muted)]">
            {hover.pages ? t('explore.map.pages', { count: hover.pages }) : null}
            {neighbours && neighbours.size > 1 && ` · ${t('explore.map.neighbours', { count: neighbours.size - 1 })}`}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The processed publications as a map (elvira-portal#41): dots sized by pages, class by UDC main
 * class (hue + shape), lines between mutual nearest neighbours. Click opens the publication; the
 * legend isolates a class. A list view carries the same content without the picture.
 */
export default function LibraryMap({ map, onOpen }: { map: ILibraryMap; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const [isolated, setIsolated] = useState<UdcClass | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  const counts = useMemo(() => {
    const result = new Map<UdcClass, number>();
    map.nodes.forEach((node) => {
      const cls = udcClassOf(node.udc);
      result.set(cls, (result.get(cls) ?? 0) + 1);
    });
    return result;
  }, [map.nodes]);

  const classes = UDC_CLASSES.filter((c) => counts.get(c.id));

  return (
    <div className="viz-root flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <span className="mr-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('explore.map.legend')}</span>
        {classes.map((c) => {
          const active = isolated === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setIsolated(active ? null : c.id)}
              className={twMerge(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'border-zinc-500 bg-zinc-100 font-semibold text-zinc-900 dark:border-zinc-400 dark:bg-zinc-700 dark:text-zinc-50'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800',
                isolated && !active && 'opacity-60'
              )}
            >
              <Swatch cls={c.id} />
              {t(`explore.classes.${c.id}`)}
              <span className="tabular-nums text-zinc-400">{counts.get(c.id)}</span>
            </button>
          );
        })}
        <div className="ml-auto flex rounded-lg border border-zinc-200 p-0.5 text-xs dark:border-zinc-700" role="tablist" aria-label={t('explore.map.viewLabel')}>
          {(['map', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={twMerge(
                'rounded-md px-2.5 py-1',
                view === v ? 'bg-primaryLight font-semibold text-primaryText dark:bg-primaryDark dark:text-primaryLight' : 'text-zinc-500'
              )}
            >
              {t(`explore.map.view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-[var(--viz-surface)] dark:border-zinc-700">
          <Responsive>{(width) => <MapCanvas map={map} width={width} isolated={isolated} onOpen={onOpen} />}</Responsive>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes
            .filter((c) => !isolated || c.id === isolated)
            .map((c) => (
              <section key={c.id}>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  <Swatch cls={c.id} /> {t(`explore.classes.${c.id}`)}
                </h3>
                <ul className="flex flex-col gap-0.5 text-sm">
                  {map.nodes
                    .filter((node) => udcClassOf(node.udc) === c.id)
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((node) => (
                      <li key={node.id}>
                        <button type="button" onClick={() => onOpen(node.id)} className="text-left text-zinc-700 hover:text-primary hover:underline dark:text-zinc-300">
                          {node.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </div>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('explore.map.note')}</p>
    </div>
  );
}
