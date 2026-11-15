import { useMemo } from 'react';
import { useLibraryMap } from '../../../hooks/api/graph/useGraph';
import { ILibraryMap, ILibraryMapNode } from '../../../utils/interfaces/graph';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import {
  UDC_CLASSES,
  UdcClass,
  udcClassOf,
} from '../../../utils/func/udcClass';

/** The graph routes (and /explore) only exist where experimental features are on. */
export const SEMANTICS_ON =
  import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';

/**
 * The library map for the dashboard's semantic layer. Same cache key as Explore, so a visit
 * to either warms the other. Never throws into the page: a failure just hides the layer.
 */
export const useDashboardMap = () =>
  useLibraryMap({ enabled: SEMANTICS_ON, retry: false });

export interface Neighbour {
  id: string;
  title: string;
  score: number;
  cls: UdcClass;
  /** Lending stats when the neighbour is an LCP title; null = freely readable (no licence needed). */
  stats: ITitleStatistics | null;
}

export interface TopicRow {
  cls: UdcClass;
  titles: number;
  lcpTitles: number;
  loans: number;
  queued: number;
  copies: number;
  inUse: number;
  dormant: number;
}

export interface SemanticIndex {
  nodes: Map<string, ILibraryMapNode & { cls: UdcClass }>;
  neighbours: (id: string) => Neighbour[];
  topics: TopicRow[];
  /** How many LCP titles the graph knows — 0 means the layer has nothing to say. */
  covered: number;
}

/** Joins the meaning-graph (all processed publications) with the lending stats (LCP titles only). */
export const useSemanticIndex = (
  map: ILibraryMap | undefined,
  titles: ITitleStatistics[]
): SemanticIndex | null =>
  useMemo(() => {
    if (!map?.nodes.length) return null;
    const stats = new Map(titles.map((d) => [d.entry_id, d]));
    const nodes = new Map(
      map.nodes.map((n) => [n.id, { ...n, cls: udcClassOf(n.udc) }])
    );
    const adj = new Map<string, { id: string; score: number }[]>();
    const link = (a: string, b: string, score: number) => {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push({ id: b, score });
    };
    map.edges.forEach((e) => {
      link(e.source, e.target, e.score);
      link(e.target, e.source, e.score);
    });

    const topics = new Map<UdcClass, TopicRow>();
    nodes.forEach((n) => {
      const row = topics.get(n.cls) ?? {
        cls: n.cls,
        titles: 0,
        lcpTitles: 0,
        loans: 0,
        queued: 0,
        copies: 0,
        inUse: 0,
        dormant: 0,
      };
      row.titles += 1;
      const s = stats.get(n.id);
      if (s) {
        row.lcpTitles += 1;
        row.loans += s.loans;
        row.queued += s.queued;
        row.copies += s.copies;
        row.inUse += s.in_use;
        if (s.loans === 0) row.dormant += 1;
      }
      topics.set(n.cls, row);
    });

    return {
      nodes,
      covered: titles.filter((d) => nodes.has(d.entry_id)).length,
      topics: UDC_CLASSES.map((c) => topics.get(c.id)).filter(
        (r): r is TopicRow => !!r
      ),
      neighbours: (id) =>
        (adj.get(id) ?? [])
          .filter((n) => nodes.has(n.id))
          .sort((a, b) => b.score - a.score)
          .map((n) => {
            const node = nodes.get(n.id)!;
            return {
              id: n.id,
              title: node.title,
              score: n.score,
              cls: node.cls,
              stats: stats.get(n.id) ?? null,
            };
          }),
    };
  }, [map, titles]);

/** Free copies a reader could borrow right now; Infinity for open titles. */
export const spareOf = (n: Neighbour) =>
  n.stats ? Math.max(0, n.stats.copies - n.stats.in_use) : Infinity;
