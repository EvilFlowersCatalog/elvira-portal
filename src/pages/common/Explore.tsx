import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import ExploreCanvas, { Insets } from '../../components/graph/explore/ExploreCanvas';
import ExploreSidebar from '../../components/graph/explore/ExploreSidebar';
import FocusPanel from '../../components/graph/explore/FocusPanel';
import { useLibraryMap } from '../../hooks/api/graph/useGraph';
import useCategoriesQuery from '../../hooks/api/categories/useCategoriesQuery';
import useElementSize from '../../hooks/useElementSize';
import { Arrangement, buildExploreGraph, ExploreNode } from '../../utils/func/exploreGraph';
import { useLocalize } from '../../utils/func/localized';

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
  const [showSimilar, setShowSimilar] = useState(true);
  const [showMembership, setShowMembership] = useState(true);
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

  // The walk so far, for the panel's back button.
  const [trail, setTrail] = useState<string[]>([]);
  useEffect(() => {
    setTrail((prev) => {
      if (!focusId) return [];
      if (prev[prev.length - 1] === focusId) return prev;
      if (prev[prev.length - 2] === focusId) return prev.slice(0, -1);
      return [...prev.slice(-30), focusId];
    });
  }, [focusId]);
  const previous = trail.length > 1 ? graph?.byId.get(trail[trail.length - 2]) : undefined;

  // On a narrow screen the classification panel would cover the focus panel.
  useEffect(() => {
    if (focusId && !wide) setSidebarOpen(false);
  }, [focusId, wide]);

  const insets: Insets = {
    left: sidebarOpen && wide ? GAP + SIDEBAR_W : 0,
    right: focusNode && wide ? GAP + PANEL_W : 0,
    top: 0,
    bottom: focusNode && !wide ? Math.round(height * 0.5) : 0,
  };

  const detailOpen = searchParams.has('entry-detail-id');

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
          showSimilar={showSimilar}
          showMembership={showMembership}
          keyboard={!detailOpen}
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
          style={{ width: wide ? SIDEBAR_W : `calc(100% - ${GAP * 2}px)`, bottom: wide ? 80 : undefined, maxHeight: wide ? undefined : '70%' }}
        >
          <ExploreSidebar
            graph={graph}
            labelOf={labelOf}
            focusId={focusId}
            onFocus={setFocus}
            onHighlight={setHighlightId}
            showSimilar={showSimilar}
            setShowSimilar={setShowSimilar}
            showMembership={showMembership}
            setShowMembership={setShowMembership}
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            arrangement={arrangement}
            setArrangement={setArrangement}
          />
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
          />
        </div>
      )}
    </div>
  );
};

export default Explore;
