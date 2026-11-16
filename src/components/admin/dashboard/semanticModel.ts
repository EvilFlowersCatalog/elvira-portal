/**
 * The dashboard's semantic layer, as plain data: the library graph (every processed publication,
 * edges = mutual nearest neighbours by content) joined with lending statistics (LCP titles only).
 *
 * Everything here answers one operational question — "where can a reader go instead?":
 *  - **neighbours**: a title's direct graph neighbours, i.e. its closest substitutes;
 *  - **neighbourhoods**: Louvain communities of the graph, i.e. groups of mutually
 *    substitutable publications, with the lending pressure inside each;
 *  - **subjects**: lending per catalogue subject (UDC term) as Percentage of Expected Use;
 *  - **actions**: the titles that need a decision, sorted into buy / redirect / promote / review.
 *
 * Free titles (no LCP licence) carry no usage data: they count as supply ("readable without a
 * wait"), never as evidence of low demand.
 */
import type { ILibraryMap, ILibraryMapEdge, ILibraryMapNode } from '../../../utils/interfaces/graph';
import type { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { UdcClass, udcClassOf } from '../../../utils/func/udcClass';
import { louvain } from '../../../utils/func/communities';

/** Mirrors `needsCopies` in format.ts (kept local so this module stays free of UI imports). */
const busyAndQueued = (t: ITitleStatistics) => t.utilization >= 0.8 && t.holds_ratio >= 1;

export interface Neighbour {
  id: string;
  title: string;
  score: number;
  cls: UdcClass;
  /** Lending stats when the neighbour is an LCP title; null = freely readable (no licence needed). */
  stats: ITitleStatistics | null;
}

/** Free copies a reader could borrow right now; Infinity for open titles. */
export const spareOf = (n: Neighbour) => (n.stats ? Math.max(0, n.stats.copies - n.stats.in_use) : Infinity);

/** A substitute is something a waiting reader can open today. */
export const isSubstitute = (n: Neighbour) => spareOf(n) > 0;

/**
 * What a neighbourhood needs, most urgent first:
 * short    — people wait and nothing nearby is free: only more copies help;
 * redirect — people wait, but a close title has a free copy or is open access;
 * lending  — borrowed, nobody waiting;
 * quiet    — licensed, but nothing borrowed in the period;
 * open     — only freely readable titles: no lending to judge.
 */
export type HoodStatus = 'short' | 'redirect' | 'lending' | 'quiet' | 'open';
export const HOOD_STATUSES: HoodStatus[] = ['short', 'redirect', 'lending', 'quiet', 'open'];

export interface Neighbourhood {
  /** Stable within one map: communities numbered by size. */
  id: number;
  members: string[];
  edges: ILibraryMapEdge[];
  /** Catalogue terms of the members, most common first. */
  terms: { term: string; count: number }[];
  /** Best-connected member: the title the group is "around". */
  central: string;
  lcpTitles: number;
  openTitles: number;
  copies: number;
  inUse: number;
  spare: number;
  queued: number;
  loans: number;
  /** LCP titles unborrowed in the period (titles added during it excluded). */
  unused: number;
  status: HoodStatus;
}

export interface SubjectRow {
  /** Catalogue term, or null for LCP titles the graph does not know yet. */
  term: string | null;
  publications: number;
  openTitles: number;
  lcpTitles: number;
  copies: number;
  inUse: number;
  loans: number;
  queued: number;
  unused: number;
  /** This subject's share of all LCP copies (supply) and of all loans (demand), 0..1. */
  copyShare: number;
  loanShare: number;
  /** Percentage of Expected Use as a ratio: loanShare ÷ copyShare. 1 = borrowed in proportion. */
  peu: number | null;
}

export type ActionKind = 'buy' | 'redirect' | 'promote' | 'review';
export const ACTION_KINDS: ActionKind[] = ['buy', 'redirect', 'promote', 'review'];

export interface TitleAction {
  kind: ActionKind;
  id: string;
  stats: ITitleStatistics;
  /** redirect: substitutes with room; promote: borrowed neighbours. Best first. */
  via: Neighbour[];
}

export interface SemanticIndex {
  nodes: Map<string, ILibraryMapNode & { cls: UdcClass }>;
  neighbours: (id: string) => Neighbour[];
  neighbourhoods: Neighbourhood[];
  /** Publications with no close neighbour at all: nothing to send their readers to. */
  loners: string[];
  hoodOf: Map<string, number>;
  subjects: SubjectRow[];
  actions: Record<ActionKind, TitleAction[]>;
  /** How many LCP titles the graph knows — 0 means the layer has nothing to say. */
  covered: number;
  /** LCP titles not on the graph yet (not processed): no neighbours, no subject. */
  uncovered: ITitleStatistics[];
}

/** A licensed title with no loan in the period that was already in the library when it began. */
export const isUnused = (s: ITitleStatistics, periodFrom: string) => s.loans === 0 && s.added_at.slice(0, 10) < periodFrom;

/**
 * A neighbourhood's status follows its members' actions, so the tiles and the action board always
 * tell the same story: any member to buy for → short; any member to redirect → redirect.
 */
const hoodStatus = (h: Omit<Neighbourhood, 'status'>, kindOf: Map<string, ActionKind>): HoodStatus => {
  if (!h.lcpTitles) return 'open';
  const kinds = new Set(h.members.map((m) => kindOf.get(m)));
  if (kinds.has('buy')) return 'short';
  if (kinds.has('redirect')) return 'redirect';
  return h.loans > 0 ? 'lending' : 'quiet';
};

export function buildSemanticIndex(
  map: ILibraryMap,
  titles: ITitleStatistics[],
  periodFrom: string
): SemanticIndex {
  const stats = new Map(titles.map((d) => [d.entry_id, d]));
  const nodes = new Map(map.nodes.map((n) => [n.id, { ...n, cls: udcClassOf(n.udc) }]));
  const edges = map.edges.filter((e) => nodes.has(e.source) && nodes.has(e.target));

  const adj = new Map<string, { id: string; score: number }[]>();
  const link = (a: string, b: string, score: number) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ id: b, score });
  };
  edges.forEach((e) => {
    link(e.source, e.target, e.score);
    link(e.target, e.source, e.score);
  });

  const neighbours = (id: string): Neighbour[] =>
    (adj.get(id) ?? [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((n) => {
        const node = nodes.get(n.id)!;
        return { id: n.id, title: node.title, score: n.score, cls: node.cls, stats: stats.get(n.id) ?? null };
      });

  // ── Neighbourhoods ────────────────────────────────────────────────────────────────────────────
  const community = louvain(
    map.nodes.map((n) => n.id),
    edges.map((e) => ({ source: e.source, target: e.target, weight: e.score }))
  );
  const groups = new Map<number, string[]>();
  community.forEach((c, id) => {
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(id);
  });

  // ── Actions (first: neighbourhood status is derived from them) ───────────────────────────────
  const actions: Record<ActionKind, TitleAction[]> = { buy: [], redirect: [], promote: [], review: [] };
  titles.forEach((s) => {
    if (!nodes.has(s.entry_id)) return;
    const near = neighbours(s.entry_id);
    if (s.queued > 0 || busyAndQueued(s)) {
      const subs = near.filter(isSubstitute).sort((a, b) => Math.min(spareOf(b), 99) - Math.min(spareOf(a), 99) || b.score - a.score);
      actions[subs.length ? 'redirect' : 'buy'].push({ kind: subs.length ? 'redirect' : 'buy', id: s.entry_id, stats: s, via: subs });
    } else if (isUnused(s, periodFrom)) {
      const borrowed = near.filter((n) => (n.stats?.loans ?? 0) > 0).sort((a, b) => b.stats!.loans - a.stats!.loans);
      actions[borrowed.length ? 'promote' : 'review'].push({
        kind: borrowed.length ? 'promote' : 'review',
        id: s.entry_id,
        stats: s,
        via: borrowed,
      });
    }
  });
  actions.buy.sort((a, b) => b.stats.holds_ratio - a.stats.holds_ratio || b.stats.queued - a.stats.queued);
  actions.redirect.sort((a, b) => b.stats.queued - a.stats.queued);
  actions.promote.sort((a, b) => (b.via[0]?.stats?.loans ?? 0) - (a.via[0]?.stats?.loans ?? 0));
  // Most idle licences first: those are the renewals worth questioning.
  actions.review.sort((a, b) => b.stats.copies - a.stats.copies || a.stats.title.localeCompare(b.stats.title));
  const kindOf = new Map(ACTION_KINDS.flatMap((kind) => actions[kind].map((a) => [a.id, kind] as const)));

  const loners: string[] = [];
  const neighbourhoods: Neighbourhood[] = [];
  const hoodOf = new Map<string, number>();
  groups.forEach((members, id) => {
    if (members.length < 2) {
      loners.push(...members);
      return;
    }
    const inside = new Set(members);
    const own = edges.filter((e) => inside.has(e.source) && inside.has(e.target));
    const strength = new Map<string, number>();
    own.forEach((e) => {
      strength.set(e.source, (strength.get(e.source) ?? 0) + e.score);
      strength.set(e.target, (strength.get(e.target) ?? 0) + e.score);
    });
    const termCount = new Map<string, number>();
    members.forEach((m) => {
      const term = nodes.get(m)!.udc[0];
      if (term) termCount.set(term, (termCount.get(term) ?? 0) + 1);
    });
    const base = {
      id,
      members,
      edges: own,
      terms: [...termCount].map(([term, count]) => ({ term, count })).sort((a, b) => b.count - a.count || a.term.localeCompare(b.term)),
      central: [...members].sort((a, b) => (strength.get(b) ?? 0) - (strength.get(a) ?? 0))[0],
      lcpTitles: 0,
      openTitles: 0,
      copies: 0,
      inUse: 0,
      spare: 0,
      queued: 0,
      loans: 0,
      unused: 0,
    };
    members.forEach((m) => {
      hoodOf.set(m, id);
      const s = stats.get(m);
      if (!s) {
        base.openTitles += 1;
        return;
      }
      base.lcpTitles += 1;
      base.copies += s.copies;
      base.inUse += Math.min(s.in_use, s.copies);
      base.spare += Math.max(0, s.copies - s.in_use);
      base.queued += s.queued;
      base.loans += s.loans;
      if (isUnused(s, periodFrom)) base.unused += 1;
    });
    neighbourhoods.push({ ...base, status: hoodStatus(base, kindOf) });
  });
  neighbourhoods.sort(
    (a, b) =>
      HOOD_STATUSES.indexOf(a.status) - HOOD_STATUSES.indexOf(b.status) ||
      b.queued - a.queued ||
      b.loans - a.loans ||
      b.members.length - a.members.length
  );

  // ── Subjects (Percentage of Expected Use) ────────────────────────────────────────────────────
  const subjects = new Map<string | null, SubjectRow>();
  const row = (term: string | null) => {
    if (!subjects.has(term))
      subjects.set(term, {
        term,
        publications: 0,
        openTitles: 0,
        lcpTitles: 0,
        copies: 0,
        inUse: 0,
        loans: 0,
        queued: 0,
        unused: 0,
        copyShare: 0,
        loanShare: 0,
        peu: null,
      });
    return subjects.get(term)!;
  };
  map.nodes.forEach((n) => {
    const r = row(n.udc[0] ?? null);
    r.publications += 1;
    if (!stats.has(n.id)) r.openTitles += 1;
  });
  titles.forEach((s) => {
    const node = nodes.get(s.entry_id);
    const r = row(node ? (node.udc[0] ?? null) : null);
    if (!node) r.publications += 1;
    r.lcpTitles += 1;
    r.copies += s.copies;
    r.inUse += Math.min(s.in_use, s.copies);
    r.loans += s.loans;
    r.queued += s.queued;
    if (isUnused(s, periodFrom)) r.unused += 1;
  });
  const allCopies = titles.reduce((s, d) => s + d.copies, 0);
  const allLoans = titles.reduce((s, d) => s + d.loans, 0);
  subjects.forEach((r) => {
    r.copyShare = allCopies ? r.copies / allCopies : 0;
    r.loanShare = allLoans ? r.loans / allLoans : 0;
    r.peu = allLoans && r.copyShare ? r.loanShare / r.copyShare : null;
  });

  return {
    nodes,
    neighbours,
    neighbourhoods,
    loners,
    hoodOf,
    subjects: [...subjects.values()],
    actions,
    covered: titles.filter((d) => nodes.has(d.entry_id)).length,
    uncovered: titles.filter((d) => !nodes.has(d.entry_id)),
  };
}
