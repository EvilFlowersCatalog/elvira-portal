import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronRight, FiCompass, FiSearch, FiSidebar } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { Arrangement, ExploreGraph, ExploreNode } from '../../../utils/func/exploreGraph';
import { Swatch } from '../LibraryMap';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const Toggle = ({ checked, onChange, label, sample }: { checked: boolean; onChange: (v: boolean) => void; label: string; sample: 'solid' | 'dashed' }) => (
  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-primary,#0077cc)]" />
    <svg width={22} height={6} aria-hidden>
      <line x1={1} y1={3} x2={21} y2={3} stroke="var(--viz-ink-2)" strokeWidth={1.5} strokeDasharray={sample === 'dashed' ? '3 3' : undefined} />
    </svg>
    {label}
  </label>
);

/**
 * The left panel: what the page is, a search that flies to any publication or topic, and the
 * classification as a tree (domain → topic). The tree is also the map's text alternative.
 */
export default function ExploreSidebar({
  graph,
  labelOf,
  focusId,
  onFocus,
  onHighlight,
  showSimilar,
  setShowSimilar,
  showMembership,
  setShowMembership,
  open,
  setOpen,
  arrangement,
  setArrangement,
}: {
  arrangement: Arrangement;
  setArrangement: (a: Arrangement) => void;
  graph: ExploreGraph;
  labelOf: (n: ExploreNode) => string;
  focusId: string | null;
  onFocus: (id: string | null) => void;
  onHighlight: (id: string | null) => void;
  showSimilar: boolean;
  setShowSimilar: (v: boolean) => void;
  showMembership: boolean;
  setShowMembership: (v: boolean) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);

  const domains = useMemo(() => graph.nodes.filter((n) => n.kind === 'domain'), [graph]);
  const entryCount = useMemo(() => graph.nodes.filter((n) => n.kind === 'entry').length, [graph]);
  const focused = focusId ? graph.byId.get(focusId) : undefined;
  // The focused node's domain stays unfolded, so the tree shows where you are.
  const openDomain = focused ? (focused.kind === 'domain' ? focused.id : focused.domainId) : undefined;

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (q.length < 2) return [];
    const scored = graph.nodes
      .map((n) => {
        const text = fold(n.kind === 'entry' ? (n.title ?? '') : `${labelOf(n)} ${n.term ?? ''}`);
        const at = text.indexOf(q);
        return at < 0 ? null : { n, rank: (n.kind === 'entry' ? 10 : 0) + (at === 0 ? 0 : 5) + text.length / 200 };
      })
      .filter((x): x is { n: ExploreNode; rank: number } => !!x)
      .sort((a, b) => a.rank - b.rank);
    return scored.slice(0, 8).map((x) => x.n);
  }, [query, graph, labelOf]);

  const pick = (n: ExploreNode) => {
    onFocus(n.id);
    setQuery('');
    onHighlight(null);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        // The guide's page anchor lives on whichever form of the panel is showing.
        data-guide="page-title"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 px-3 py-2.5 text-sm font-semibold text-zinc-800 shadow-lg backdrop-blur-md hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100"
        aria-label={t('explore.panel.show')}
      >
        <FiCompass className="text-primary dark:text-primaryLight" /> {t('explore.title')}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 data-guide="page-title" className="flex items-center gap-2 text-xl font-extrabold text-secondary dark:text-secondaryLight">
              <FiCompass className="shrink-0 text-primary dark:text-primaryLight" /> {t('explore.title')}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{t('explore.panel.intro', { count: entryCount })}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('explore.panel.hide')}
            title={t('explore.panel.hide')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <FiSidebar />
          </button>
        </div>

        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault();
                pick(results[active]);
              } else if (e.key === 'Escape') {
                setQuery('');
              }
            }}
            placeholder={t('explore.panel.search')}
            aria-label={t('explore.panel.search')}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="explore-search-results"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:bg-zinc-900"
          />
          {results.length > 0 && (
            <ul
              id="explore-search-results"
              role="listbox"
              className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              {results.map((n, i) => (
                <li key={n.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => {
                      setActive(i);
                      onHighlight(n.id);
                    }}
                    onMouseLeave={() => onHighlight(null)}
                    onClick={() => pick(n)}
                    className={twMerge('flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm', i === active && 'bg-zinc-100 dark:bg-zinc-800')}
                  >
                    <Swatch cls={n.cls} />
                    <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-100">{n.kind === 'entry' ? n.title : labelOf(n)}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">{t(`explore.kind.${n.kind}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <nav aria-label={t('explore.panel.classification')} className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-100 px-2 py-2 dark:border-zinc-800">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('explore.panel.classification')}</p>
        <ul className="flex flex-col">
          {domains.map((d) => {
            const isOpen = expanded.has(d.id) || openDomain === d.id;
            const topics = d.children.map((id) => graph.byId.get(id)!).sort((a, b) => b.children.length - a.children.length);
            const count = graph.nodes.filter((n) => n.kind === 'entry' && n.domainId === d.id).length;
            return (
              <li key={d.id}>
                <div className={twMerge('flex items-center rounded-lg', focusId === d.id && 'bg-primaryLight/60 dark:bg-primaryDark/40')}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={t(isOpen ? 'explore.panel.collapse' : 'explore.panel.expand')}
                    disabled={!topics.length}
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(d.id)) next.delete(d.id);
                        else next.add(d.id);
                        return next;
                      })
                    }
                    className="grid h-7 w-6 shrink-0 place-items-center text-zinc-400 hover:text-zinc-700 disabled:opacity-0 dark:hover:text-zinc-200"
                  >
                    {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onFocus(focusId === d.id ? null : d.id)}
                    onMouseEnter={() => onHighlight(d.id)}
                    onMouseLeave={() => onHighlight(null)}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left text-sm font-semibold text-zinc-800 hover:text-primary dark:text-zinc-100 dark:hover:text-primaryLight"
                  >
                    <Swatch cls={d.cls} />
                    <span className="truncate">{labelOf(d)}</span>
                    <span className="ml-auto text-xs font-normal tabular-nums text-zinc-400">{count}</span>
                  </button>
                </div>
                {isOpen && (
                  <ul className="mb-1 ml-6 flex flex-col border-l border-zinc-200 pl-1 dark:border-zinc-700">
                    {topics.map((tp) => (
                      <li key={tp.id}>
                        <button
                          type="button"
                          onClick={() => onFocus(focusId === tp.id ? null : tp.id)}
                          onMouseEnter={() => onHighlight(tp.id)}
                          onMouseLeave={() => onHighlight(null)}
                          className={twMerge(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
                            (focusId === tp.id || focused?.topicId === tp.id) && 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white'
                          )}
                        >
                          <span className="truncate">{labelOf(tp)}</span>
                          <span className="ml-auto text-[11px] tabular-nums text-zinc-400">{tp.children.length}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-1.5 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('explore.panel.arrange')}</span>
          <div role="radiogroup" aria-label={t('explore.panel.arrange')} className="flex flex-1 rounded-lg border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
            {(['content', 'topics'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={arrangement === a}
                onClick={() => setArrangement(a)}
                className={twMerge(
                  'flex-1 rounded-md px-2 py-1 transition-colors',
                  arrangement === a ? 'bg-primaryLight font-semibold text-primaryText dark:bg-primaryDark dark:text-primaryLight' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                )}
              >
                {t(`explore.panel.arrangeBy.${a}`)}
              </button>
            ))}
          </div>
        </div>
        <Toggle checked={showSimilar} onChange={setShowSimilar} label={t('explore.panel.similarLinks')} sample="solid" />
        <Toggle checked={showMembership} onChange={setShowMembership} label={t('explore.panel.topicLinks')} sample="dashed" />
        <p className="pt-1 text-[11px] leading-snug text-zinc-400">{t('explore.map.note')}</p>
      </div>
    </div>
  );
}
