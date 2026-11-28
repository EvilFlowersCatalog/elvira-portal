import { ILibraryMap } from '../interfaces/graph';
import { forceLayout } from './forceLayout';
import { UDC_CLASSES, UdcClass, udcClassOf } from './udcClass';

/**
 * The Explore graph: the library map's publications plus the classification as nodes of their own.
 *
 * - A *domain* is a UDC main class (the six map classes of `udcClass.ts`, plus "unclassified").
 * - A *topic* is the publication's own category term ("004", "37", "502/504"; free-text terms of
 *   older imports count too). Topics come from the catalog's classification, not from the
 *   similarity edges: those also cluster by language, so groups inferred from them would partly
 *   be language groups.
 *
 * Two edge kinds, kept apart everywhere (drawing, neighbour counts): `similar` (mutual nearest
 * neighbours by content, from the API) and `member` (publication → topic → domain).
 */

export type ExploreKind = 'entry' | 'topic' | 'domain';

export interface ExploreNode {
  id: string;
  kind: ExploreKind;
  cls: UdcClass;
  /** Layout radius in world units. */
  r: number;
  x: number;
  y: number;
  /** entry */
  title?: string;
  pages?: number | null;
  udc?: string[];
  topicId?: string | null;
  /** topic: the category term. */
  term?: string;
  /** topic: publications, domain: topics. */
  children: string[];
  /** topic, arranged by topics: radius of its cluster in world units (its label sits above it). */
  extent?: number;
  /** entry → domain id; topic → domain id. */
  domainId?: string;
}

export interface ExploreEdge {
  source: string;
  target: string;
  kind: 'similar' | 'member';
  score?: number;
}

export interface ExploreGraph {
  nodes: ExploreNode[];
  byId: Map<string, ExploreNode>;
  edges: ExploreEdge[];
  /** Publication → its content neighbours, closest first. */
  similar: Map<string, { id: string; score: number }[]>;
  /** Topic → other topics it shares similarity edges with, most shared first. */
  relatedTopics: Map<string, { id: string; links: number }[]>;
  /** One road per pair of topics that share similarity edges: what the overview draws instead of every edge. */
  roads: ExploreRoad[];
  /** Publication → its similarity edges. */
  edgesOf: Map<string, ExploreEdge[]>;
}

export interface ExploreRoad {
  a: string;
  b: string;
  /** Similarity edges between the two topics' publications. */
  links: number;
  /** The strongest road of either end: drawn in the overview. */
  main: boolean;
}

/** What the reader has done with a publication (history and shelf). */
export interface PersonalMark {
  readAt?: string;
  reads?: number;
  shelfAt?: string;
}

/** Unread publications closest to what the reader has read, best first; `via` is the read one that pulls hardest. */
export function readNext(graph: ExploreGraph, readIds: Set<string>, limit = 6) {
  const found = new Map<string, { id: string; score: number; via: string; best: number }>();
  readIds.forEach((readId) => {
    (graph.similar.get(readId) ?? []).forEach(({ id, score }) => {
      if (readIds.has(id)) return;
      const row = found.get(id) ?? { id, score: 0, via: readId, best: 0 };
      row.score += score;
      if (score > row.best) {
        row.best = score;
        row.via = readId;
      }
      found.set(id, row);
    });
  });
  return [...found.values()].sort((x, y) => y.score - x.score).slice(0, limit);
}

export const topicId = (term: string) => `topic:${term}`;
export const domainId = (cls: UdcClass) => `domain:${cls}`;

/** Radius by page count: area grows with length, clamped so short reports stay clickable. */
export const entryRadius = (pages: number | null | undefined) => Math.max(4, Math.min(13, Math.sqrt(pages ?? 80) * 0.55));

/** The term a publication is filed under on the map: its first UDC code, else its first term. */
const primaryTerm = (terms: string[]): string | null =>
  terms.find((term) => /^\s*\d/.test(term))?.trim() ?? terms.find((term) => term.trim())?.trim() ?? null;

/**
 * `content`: content closeness shapes the map, membership only nudges.
 * `topics`: membership dominates, so publications gather around their topic and domain.
 */
export type Arrangement = 'content' | 'topics';

export function buildExploreGraph(map: ILibraryMap, arrangement: Arrangement = 'content'): ExploreGraph {
  const ids = new Set(map.nodes.map((n) => n.id));
  const entries: ExploreNode[] = map.nodes.map((n) => {
    const term = primaryTerm(n.udc);
    const cls = udcClassOf(n.udc);
    return {
      id: n.id,
      kind: 'entry',
      cls,
      r: entryRadius(n.pages),
      x: 0,
      y: 0,
      title: n.title,
      pages: n.pages,
      udc: n.udc,
      topicId: term ? topicId(term) : null,
      domainId: domainId(cls),
      children: [],
    };
  });

  const topics = new Map<string, ExploreNode>();
  const domains = new Map<string, ExploreNode>();
  entries.forEach((entry) => {
    if (!domains.has(entry.domainId!)) {
      domains.set(entry.domainId!, { id: entry.domainId!, kind: 'domain', cls: entry.cls, r: 20, x: 0, y: 0, children: [] });
    }
    if (!entry.topicId) {
      return;
    }
    let topic = topics.get(entry.topicId);
    if (!topic) {
      topic = {
        id: entry.topicId,
        kind: 'topic',
        cls: entry.cls,
        r: 8,
        x: 0,
        y: 0,
        term: entry.topicId.slice('topic:'.length),
        domainId: entry.domainId,
        children: [],
      };
      topics.set(entry.topicId, topic);
      domains.get(entry.domainId!)!.children.push(topic.id);
    }
    topic.children.push(entry.id);
  });
  topics.forEach((topic) => {
    topic.r = Math.min(20, 7 + Math.sqrt(topic.children.length) * 2.2);
  });

  const similarEdges: ExploreEdge[] = map.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target, kind: 'similar', score: e.score }));
  const memberEdges: ExploreEdge[] = [
    ...entries.map((e) => ({ source: e.id, target: e.topicId ?? e.domainId!, kind: 'member' as const })),
    ...[...topics.values()].map((t) => ({ source: t.id, target: t.domainId!, kind: 'member' as const })),
  ];

  // Domain order follows UDC, so the same library always gets the same domain list.
  const domainOrder = UDC_CLASSES.map((c) => domainId(c.id));
  const nodes = [
    ...entries,
    ...[...topics.values()].sort((a, b) => b.children.length - a.children.length),
    ...[...domains.values()].sort((a, b) => domainOrder.indexOf(a.id) - domainOrder.indexOf(b.id)),
  ];

  if (arrangement === 'topics') {
    layoutByTopics(
      nodes.filter((n) => n.kind === 'domain'),
      new Map(nodes.map((n) => [n.id, n])),
      entries
    );
  } else {
    // Membership springs are weak here: they gather a topic without overruling content closeness.
    const positions = forceLayout(
      nodes.map((n) => ({ id: n.id, r: n.r + (n.kind === 'entry' ? 0 : 6) })),
      [
        ...similarEdges.map((e) => ({ source: e.source, target: e.target, weight: e.score })),
        ...memberEdges.map((e) => {
          const toDomain = e.target.startsWith('domain:');
          const fromTopic = e.source.startsWith('topic:');
          return {
            source: e.source,
            target: e.target,
            weight: fromTopic ? 0.25 : toDomain ? 0.3 : 0.6,
            length: fromTopic ? 70 : toDomain ? 50 : 30,
          };
        }),
      ],
      360
    );
    nodes.forEach((n) => Object.assign(n, positions.get(n.id)));
  }

  const similar = new Map<string, { id: string; score: number }[]>();
  similarEdges.forEach((e) => {
    similar.set(e.source, [...(similar.get(e.source) ?? []), { id: e.target, score: e.score! }]);
    similar.set(e.target, [...(similar.get(e.target) ?? []), { id: e.source, score: e.score! }]);
  });
  similar.forEach((list) => list.sort((a, b) => b.score - a.score));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const topicLinks = new Map<string, Map<string, number>>();
  similarEdges.forEach((e) => {
    const a = byId.get(e.source)!.topicId;
    const b = byId.get(e.target)!.topicId;
    if (!a || !b || a === b) return;
    [
      [a, b],
      [b, a],
    ].forEach(([from, to]) => {
      const row = topicLinks.get(from) ?? new Map<string, number>();
      row.set(to, (row.get(to) ?? 0) + 1);
      topicLinks.set(from, row);
    });
  });
  const relatedTopics = new Map(
    [...topicLinks].map(([id, row]) => [
      id,
      [...row].map(([other, links]) => ({ id: other, links })).sort((x, y) => y.links - x.links),
    ])
  );

  const roads: ExploreRoad[] = [];
  relatedTopics.forEach((list, a) => {
    list.forEach(({ id: b, links }, i) => {
      if (a >= b) return;
      const back = relatedTopics.get(b)?.findIndex((r) => r.id === a) ?? 9;
      roads.push({ a, b, links, main: i < 1 || back < 1 });
    });
  });

  const edgesOf = new Map<string, ExploreEdge[]>();
  similarEdges.forEach((e) => {
    [e.source, e.target].forEach((id) => edgesOf.set(id, [...(edgesOf.get(id) ?? []), e]));
  });

  return { nodes, byId, edges: [...memberEdges, ...similarEdges], similar, relatedTopics, roads, edgesOf };
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const SPACING = 11;

/** Sunflower spiral around (cx, cy), starting outside `inner`; returns the radius used. */
const sunflower = (items: ExploreNode[], cx: number, cy: number, inner: number) => {
  items.forEach((n, i) => {
    const rad = inner + SPACING * Math.sqrt(i + 0.5);
    n.x = cx + Math.cos(i * GOLDEN) * rad;
    n.y = cy + Math.sin(i * GOLDEN) * rad;
  });
  return inner + SPACING * Math.sqrt(Math.max(items.length, 1)) + 8;
};

/** Points on a ring, each item getting arc length in proportion to its own diameter. */
const ringOf = <T extends { size: number }>(items: T[], gap: number, minRadius: number) => {
  const total = items.reduce((sum, it) => sum + it.size * 2 + gap, 0);
  const radius = items.length === 0 ? 0 : items.length === 1 ? minRadius : Math.max(minRadius, total / (Math.PI * 2));
  let at = -Math.PI / 2;
  return {
    radius,
    places: items.map((it) => {
      const share = ((it.size * 2 + gap) / total) * Math.PI * 2;
      const angle = at + share / 2;
      at += share;
      return { item: it, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }),
  };
};

/**
 * The classification as a picture: domains on a ring, each domain's topics around it, each
 * topic's publications packed in a sunflower around the topic. Deterministic, no simulation.
 * Within a topic, the longest publications sit nearest the centre.
 */
function layoutByTopics(domains: ExploreNode[], byId: Map<string, ExploreNode>, entries: ExploreNode[]) {
  const clusters = domains.map((domain) => {
    const topics = domain.children
      .map((id) => byId.get(id)!)
      .map((topic) => {
        const members = topic.children.map((id) => byId.get(id)!).sort((a, b) => b.r - a.r);
        // Laid out around (0, 0) first, shifted into place once the ring is known.
        topic.x = 0;
        topic.y = 0;
        const size = sunflower(members, 0, 0, topic.r + 8);
        topic.extent = size - 8;
        return { topic, members, size };
      })
      .sort((a, b) => b.size - a.size);
    const unfiled = entries.filter((e) => !e.topicId && e.domainId === domain.id);
    // Room between the domain hub and its topics for the domain's own label (written under the hub).
    const ring = ringOf(topics, 40, domain.r + 95 + Math.max(0, ...topics.map((t) => t.size)));
    ring.places.forEach(({ item, x, y }) => {
      item.topic.x = x;
      item.topic.y = y;
      item.members.forEach((m) => {
        m.x += x;
        m.y += y;
      });
    });
    domain.x = 0;
    domain.y = 0;
    sunflower(unfiled, 0, 0, domain.r + 10);
    const size = ring.radius + Math.max(domain.r + 20, ...topics.map((t) => t.size));
    return { domain, topics, unfiled, size };
  });

  const outer = ringOf(clusters, 60, 0);
  outer.places.forEach(({ item, x, y }) => {
    const shift = (n: ExploreNode) => {
      n.x += x;
      n.y += y;
    };
    shift(item.domain);
    item.unfiled.forEach(shift);
    item.topics.forEach((t) => {
      shift(t.topic);
      t.members.forEach(shift);
    });
  });
}

/** What a focus lights up: `primary` is framed by the camera, `secondary` stays half lit. */
export function focusSets(graph: ExploreGraph, focusId: string | null) {
  const node = focusId ? graph.byId.get(focusId) : undefined;
  if (!node) return null;
  const primary = new Set<string>([node.id]);
  const secondary = new Set<string>();

  if (node.kind === 'entry') {
    (graph.similar.get(node.id) ?? []).forEach((n) => primary.add(n.id));
    const topic = node.topicId ? graph.byId.get(node.topicId) : undefined;
    if (topic) {
      primary.add(topic.id);
      topic.children.forEach((id) => secondary.add(id));
    }
    // No content neighbours: frame it among its topic instead of alone.
    if (primary.size <= 2 && topic) topic.children.slice(0, 8).forEach((id) => primary.add(id));
    if (node.domainId) secondary.add(node.domainId);
  } else if (node.kind === 'topic') {
    node.children.forEach((id) => primary.add(id));
    if (node.domainId) secondary.add(node.domainId);
    (graph.relatedTopics.get(node.id) ?? []).forEach((t) => secondary.add(t.id));
  } else {
    node.children.forEach((tid) => {
      primary.add(tid);
      graph.byId.get(tid)?.children.forEach((id) => primary.add(id));
    });
    // Unfiled publications hang off the domain directly.
    graph.nodes.forEach((n) => {
      if (n.kind === 'entry' && !n.topicId && n.domainId === node.id) primary.add(n.id);
    });
  }
  primary.forEach((id) => secondary.delete(id));
  return { node, primary, secondary };
}
