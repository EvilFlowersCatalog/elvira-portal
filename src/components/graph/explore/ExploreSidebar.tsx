import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookmark, FiChevronDown, FiChevronRight, FiClock, FiCompass, FiGrid, FiSearch, FiSidebar } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { ExploreGraph, ExploreNode, PersonalMark, readNext } from '../../../utils/func/exploreGraph';
import { useEntriesById } from '../../../hooks/api/graph/useGraph';
import { IEntry } from '../../../utils/interfaces/entry';
import { Swatch } from '../LibraryMap';
import PubCard from './PubCard';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** 'topics', 'read', 'shelf', or the id of a tab a feature adds. */
type Mode = string;

export interface ExploreTab {
  id: string;
  icon: React.ReactNode;
  label: string;
  content: React.ReactNode;
}

/**
 * The left panel: a search that flies to any publication or topic, the reader's own starting
 * points (recently read, shelf) and the classification as a tree (domain → topic). The tree is
 * also the map's text alternative.
 */
export default function ExploreSidebar({
  graph,
  labelOf,
  focusId,
  onFocus,
  onHighlight,
  open,
  setOpen,
  marks,
  entries,
  searchAside,
  takeover,
  extraTabs = [],
  onTab,
}: {
  /** Told which tab is showing, so a feature can load its data only when its tab is open. */
  onTab?: (id: string) => void;
  /** Feature slots: a control beside the search, a view that replaces the tabs and their list while set, further tabs. */
  searchAside?: React.ReactNode;
  takeover?: React.ReactNode;
  extraTabs?: ExploreTab[];
  graph: ExploreGraph;
  labelOf: (n: ExploreNode) => string;
  focusId: string | null;
  onFocus: (id: string | null) => void;
  onHighlight: (id: string | null) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  marks: Map<string, PersonalMark>;
  /** Publications the personal lists already carry (covers, authors). */
  entries: Map<string, IEntry>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<Mode>('topics');

  const domains = useMemo(() => graph.nodes.filter((n) => n.kind === 'domain'), [graph]);
  const focused = focusId ? graph.byId.get(focusId) : undefined;
  // The focused node's domain stays unfolded, so the tree shows where you are.
  const openDomain = focused ? (focused.kind === 'domain' ? focused.id : focused.domainId) : undefined;

  // Only what is on the map can start a walk.
  const mine = useMemo(() => {
    const onMap = [...marks].filter(([id]) => graph.byId.has(id)).map(([id, mark]) => ({ node: graph.byId.get(id)!, mark }));
    return {
      read: onMap.filter((m) => m.mark.readAt).sort((a, b) => b.mark.readAt!.localeCompare(a.mark.readAt!)),
      shelf: onMap.filter((m) => m.mark.shelfAt).sort((a, b) => b.mark.shelfAt!.localeCompare(a.mark.shelfAt!)),
    };
  }, [marks, graph]);
  const next = useMemo(() => readNext(graph, new Set(mine.read.map((m) => m.node.id))), [graph, mine]);
  const { data: nextEntries } = useEntriesById(mode === 'read' ? next.map((n) => n.id) : []);

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
        className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white/95 px-3 text-sm font-semibold text-zinc-800 shadow-md backdrop-blur-md hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100"
        aria-label={t('explore.panel.show')}
      >
        <FiCompass className="text-primary dark:text-primaryLight" /> {t('explore.title')}
      </button>
    );
  }

  // Three tabs, always visible: the way back to the topics is the same as the way in.
  const tabs: { id: Mode; icon: React.ReactNode; label: string; count?: number }[] = [
    { id: 'topics', icon: <FiGrid />, label: t('explore.panel.topics') },
    { id: 'read', icon: <FiClock />, label: t('explore.panel.readShort'), count: mine.read.length },
    { id: 'shelf', icon: <FiBookmark />, label: t('explore.panel.shelfShort'), count: mine.shelf.length },
    ...extraTabs,
  ];
  const own = mode === 'read' || mode === 'shelf' ? mode : null;
  const extra = extraTabs.find((tab) => tab.id === mode);
  const tabRow = (
    <div role="tablist" className="flex h-9 items-center rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          title={tab.label}
          onClick={() => {
            setMode(tab.id);
            onTab?.(tab.id);
          }}
          className={twMerge(
            'flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1.5 transition-colors',
            mode === tab.id ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          )}
        >
          {/* Four tabs leave room for words only. */}
          {extraTabs.length === 0 && <span className="shrink-0">{tab.icon}</span>}
          <span className="truncate">{tab.label}</span>
          {!!tab.count && extraTabs.length === 0 && <span className="tabular-nums text-zinc-400">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
  const heading = (text: string, count?: number) => (
    <p className="flex items-baseline gap-1.5 px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {text}
      {count !== undefined && <span className="font-normal tabular-nums text-zinc-400">{count}</span>}
    </p>
  );

  return (
    <div className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex items-center gap-2">
          <h1 data-guide="page-title" className="flex min-w-0 flex-1 items-center gap-2 pl-1 text-lg font-extrabold text-secondary dark:text-secondaryLight">
            <FiCompass className="shrink-0 text-primary dark:text-primaryLight" /> {t('explore.title')}
          </h1>
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

        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
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
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:bg-zinc-900"
            />
            {results.length > 0 && (
              <ul
                id="explore-search-results"
                role="listbox"
                className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
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
          {searchAside}
        </div>
        {!takeover && tabRow}
      </div>

      {takeover}

      <nav
        aria-label={tabs.find((tab) => tab.id === mode)?.label}
        className={twMerge('min-h-0 flex-1 overflow-y-auto border-t border-zinc-100 px-2 py-2 dark:border-zinc-800', !!takeover && 'hidden')}
      >
        {extra?.content}

        {own && (
          <>
            {heading(t(`explore.panel.${own}`), mine[own].length)}
            {mine[own].length ? (
              <ul className="flex flex-col">
                {mine[own].map(({ node, mark }) => (
                  <PubCard key={node.id} node={node} entry={entries.get(node.id)} mark={mark} onFocus={onFocus} onHighlight={onHighlight} />
                ))}
              </ul>
            ) : (
              <p className="px-2 pb-2 text-sm text-zinc-500 dark:text-zinc-400">{t(`explore.panel.${own}Empty`)}</p>
            )}
            {mode === 'read' && next.length > 0 && (
              <>
                <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">{heading(t('explore.panel.next'), next.length)}</div>
                <ul className="flex flex-col">
                  {next.map(({ id, via, best }) => (
                    <PubCard
                      key={id}
                      node={graph.byId.get(id)!}
                      entry={nextEntries?.get(id)}
                      mark={marks.get(id)}
                      score={best}
                      note={t('explore.panel.nextVia', { title: graph.byId.get(via)?.title ?? '' })}
                      onFocus={onFocus}
                      onHighlight={onHighlight}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {mode === 'topics' && (
          <>
            {heading(t('explore.panel.classification'))}
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
                            const nextSet = new Set(prev);
                            if (nextSet.has(d.id)) nextSet.delete(d.id);
                            else nextSet.add(d.id);
                            return nextSet;
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
          </>
        )}
      </nav>
    </div>
  );
}
