import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import ExploreCanvas, { Insets } from '../../components/graph/explore/ExploreCanvas';
import ExploreSidebar from '../../components/graph/explore/ExploreSidebar';
import FocusPanel from '../../components/graph/explore/FocusPanel';
import ExploreAbout from '../../components/graph/explore/ExploreAbout';
import useExplorePersonal from '../../hooks/api/graph/useExplorePersonal';
import { FiHelpCircle } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { FiLayers } from 'react-icons/fi';
import useExploreFilters from '../../components/graph/explore/filters/useExploreFilters';
import ExploreFiltersView, { ExploreFilterButton } from '../../components/graph/explore/filters/ExploreFilters';
import useExploreTrail from '../../components/graph/explore/trail/useExploreTrail';
import ExploreTrail from '../../components/graph/explore/trail/ExploreTrail';
import useExploreCollection from '../../components/graph/explore/collections/useExploreCollection';
import ExploreCollections from '../../components/graph/explore/collections/ExploreCollections';
import { useLibraryMap } from '../../hooks/api/graph/useGraph';
import useCategoriesQuery from '../../hooks/api/categories/useCategoriesQuery';
import useElementSize from '../../hooks/useElementSize';
import { Arrangement, buildExploreGraph, ExploreNode } from '../../utils/func/exploreGraph';
import { useLocalize } from '../../utils/func/localized';

/**
 * Optional features of the map, each in its own folder under components/graph/explore/.
 * Set one to false to switch it off; to drop it for good, delete its folder and its lines here.
 */
const FEATURES = { filters: true, trail: true, collections: true };

const SIDEBAR_W = 320;
const PANEL_W = 400;
const GAP = 16;
/** Below this the panels overlay the map instead of sitting beside it. */
const WIDE = 900;

/**
 * "Explore": the library as a full-screen map to wander around (elvira-portal#41). Publications
 * are linked by content closeness; topics (category terms) and domains (UDC main classes) are
 * nodes of their own. Clicking anything flies the camera to it and opens focus mode; the URL's
 * `?focus=` is the one source of truth for what is focused, so a focus can be linked.
 */
const Explore = () => {
  const { t } = useTranslation();
  const localize = useLocalize();
  const { data, isLoading, isError } = useLibraryMap();
  const { data: categories } = useCategoriesQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const wide = width === 0 || width >= WIDE;

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= WIDE + 240);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { marks, entries } = useExplorePersonal();
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Topics first: the classification reads at a glance; "content" is one click away. In the URL
  // (`?arrange=content`) like the focus, so a shared map opens the way it was arranged.
  const arrangement: Arrangement = searchParams.get('arrange') === 'content' ? 'content' : 'topics';
  const setArrangement = useCallback(
    (next: Arrangement) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === 'content') params.set('arrange', 'content');
          else params.delete('arrange');
          return params;
        },
        { replace: true },
      ),
    [setSearchParams],
  );
  const byContent = useMemo(() => (data?.nodes.length && arrangement === 'content' ? buildExploreGraph(data, 'content') : null), [data, arrangement]);
  const byTopics = useMemo(() => (data?.nodes.length && arrangement === 'topics' ? buildExploreGraph(data, 'topics') : null), [data, arrangement]);
  const graph = arrangement === 'topics' ? byTopics : byContent;

  const termLabels = useMemo(() => {
    const labels = new Map<string, string>();
    categories?.items?.forEach((c) => {
      const text = localize(c.label);
      if (text && !labels.has(c.term)) labels.set(c.term, text);
    });
    return labels;
  }, [categories, localize]);

  const labelOf = useCallback(
    (n: ExploreNode) =>
      n.kind === 'entry' ? (n.title ?? '') : n.kind === 'topic' ? (termLabels.get(n.term!) ?? n.term!) : t(`explore.domains.${n.cls}`),
    [termLabels, t]
  );

  const focusParam = searchParams.get('focus');
  const focusId = graph && focusParam && graph.byId.has(focusParam) ? focusParam : null;
  const focusNode = focusId ? graph!.byId.get(focusId)! : null;

  // Functional update: never clobbers `entry-detail-id` or anything else in the address.
  const setFocus = useCallback(
    (id: string | null) => {
      setHighlightId(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('focus', id);
          else next.delete('focus');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // The walk so far: the panel's back button, and (FEATURE: trail) the route drawn on the map.
  const [sharedTrail] = useState(() => searchParams.get('trail'));
  const trail = useExploreTrail(graph, focusId, FEATURES.trail ? sharedTrail : null);
  const previous = trail.previousId ? graph?.byId.get(trail.previousId) : undefined;

  // FEATURE: filters / collections. Both only say which publications stay lit; the map dims the rest.
  const filters = useExploreFilters(FEATURES.filters ? graph : null, marks);
  const [tab, setTab] = useState('topics');
  const collection = useExploreCollection(FEATURES.collections ? graph : null, tab === 'collections');
  const spotlight = useMemo(() => {
    // A hiding filter takes its publications off the map instead (only, below), so it lights nothing here.
    const sets = [filters.mode === 'dim' ? filters.matches : null, collection.view?.lit].filter((x): x is Set<string> => !!x);
    if (!sets.length) return null;
    const lit = new Set([...sets[0]].filter((id) => sets.every((set) => set.has(id))));
    return { lit, near: collection.view?.near };
  }, [filters.matches, filters.mode, collection.view]);

  // On a narrow screen the classification panel would cover the focus panel.
  useEffect(() => {
    if (focusId && !wide) setSidebarOpen(false);
  }, [focusId, wide]);

  const insets: Insets = {
    left: sidebarOpen && wide ? GAP + SIDEBAR_W : 0,
    right: focusNode && wide ? GAP + PANEL_W : 0,
    // Room for the trail strip, so nothing is framed underneath it.
    top: FEATURES.trail && wide ? 56 : 0,
    bottom: focusNode && !wide ? Math.round(height * 0.5) : 0,
  };

  const detailOpen = searchParams.has('entry-detail-id');

  // The map toolbar's own controls: how the map is arranged, and what the map is.
  const arrangeSwitch = (
    <div role="radiogroup" aria-label={t('explore.panel.arrange')} title={t('explore.panel.arrange')} className="flex h-8 items-center rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
      {(['topics', 'content'] as const).map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={arrangement === a}
          onClick={() => setArrangement(a)}
          className={twMerge(
            'h-7 rounded-md px-2.5 transition-colors',
            arrangement === a ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
          )}
        >
          {t(`explore.panel.arrangeBy.${a}`)}
        </button>
      ))}
    </div>
  );
  const aboutButton = (
    <button
      type="button"
      onClick={() => setAboutOpen(true)}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <FiHelpCircle className="text-sm" /> {t('explore.about.button')}
    </button>
  );

  return (
    <div ref={rootRef} className="viz-root relative min-h-0 flex-1 overflow-hidden bg-[var(--viz-surface)]">
      {graph ? (
        <ExploreCanvas
          graph={graph}
          labelOf={labelOf}
          focusId={focusId}
          onFocus={setFocus}
          highlightId={highlightId}
          insets={insets}
          keyboard={!detailOpen && !aboutOpen}
          personal={marks}
          toolbarStart={arrangeSwitch}
          toolbarEnd={aboutButton}
          spotlight={spotlight}
          only={filters.mode === 'hide' ? filters.matches : null}
          trail={FEATURES.trail ? trail.trail : undefined}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          {isLoading ? (
            <CircleLoader size={40} color="#0077cc" />
          ) : (
            // An empty map means the graph is off or not filled yet: say so quietly, no error state.
            <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{isError ? t('explore.error') : t('explore.empty')}</p>
          )}
        </div>
      )}

      {graph && (
        <div
          className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col items-start"
          style={{ width: wide ? SIDEBAR_W : `calc(100% - ${GAP * 2}px)`, bottom: wide ? 68 : undefined, maxHeight: wide ? undefined : '70%' }}
        >
          <ExploreSidebar
            graph={graph}
            labelOf={labelOf}
            focusId={focusId}
            onFocus={setFocus}
            onHighlight={setHighlightId}
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            marks={marks}
            entries={entries}
            onTab={(id) => {
              setTab(id);
              // Leaving the collections tab switches its lighting off: nothing dims the map unseen.
              if (id !== 'collections') collection.select(null);
            }}
            searchAside={FEATURES.filters ? <ExploreFilterButton filters={filters} /> : undefined}
            takeover={FEATURES.filters && filters.open ? <ExploreFiltersView filters={filters} total={graph.nodes.filter((n) => n.kind === 'entry').length} /> : undefined}
            extraTabs={
              FEATURES.collections
                ? [
                    {
                      id: 'collections',
                      icon: <FiLayers />,
                      label: t('explore.collections.tab'),
                      content: <ExploreCollections state={collection} graph={graph} marks={marks} onFocus={setFocus} onHighlight={setHighlightId} />,
                    },
                  ]
                : []
            }          />
        </div>
      )}

      {/* FEATURE: trail. A strip along the top of the map, between the two panels. */}
      {graph && FEATURES.trail && wide && (
        <div
          className="pointer-events-none absolute top-4 z-20 flex"
          style={{ left: sidebarOpen ? GAP + SIDEBAR_W + GAP : 176, right: focusNode ? GAP + PANEL_W + GAP : GAP }}
        >
          <ExploreTrail state={trail} graph={graph} labelOf={labelOf} focusId={focusId} onFocus={setFocus} />
        </div>
      )}

      {graph && focusNode && (
        <div
          className="pointer-events-none absolute z-20 flex animate-fade-in flex-col"
          // Wide: a column on the right, clear of the assistant launcher. Narrow: a bottom sheet.
          style={
            wide
              ? { right: GAP, top: GAP, bottom: 84, width: PANEL_W }
              : { left: 8, right: 8, bottom: 8, height: `calc(50% - 8px)` }
          }
        >
          <FocusPanel
            graph={graph}
            node={focusNode}
            labelOf={labelOf}
            onFocus={setFocus}
            onHighlight={setHighlightId}
            onBack={previous ? () => setFocus(previous.id) : undefined}
            backLabel={previous ? labelOf(previous) : undefined}
            marks={marks}
          />
        </div>
      )}

      {graph && <ExploreAbout open={aboutOpen} onClose={() => setAboutOpen(false)} graph={graph} marks={marks} entries={entries} onFocus={setFocus} />}
    </div>
  );
};

export default Explore;
