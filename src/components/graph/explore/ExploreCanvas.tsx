import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useElementSize from '../../../hooks/useElementSize';
import { useTranslation } from 'react-i18next';
import { FiMaximize, FiMinus, FiPlus } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { ExploreEdge, ExploreGraph, ExploreNode, ExploreRoad, focusSets, PersonalMark } from '../../../utils/func/exploreGraph';
import { UDC_CLASS } from '../../../utils/func/udcClass';
import { Mark } from '../LibraryMap';
import { PersonalStatus } from './PubCard';

/** Camera: screen = world · k + (tx, ty). */
interface Camera {
  k: number;
  tx: number;
  ty: number;
}

export interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const MIN_K = 0.2;
const MAX_K = 9;
const DRAG_THRESHOLD = 4;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The full-screen Explore map: pan (drag), zoom (wheel, pinch, buttons, double-click), and a
 * focus mode that flies the camera to whatever is focused and frames its neighbourhood.
 * Positions are drawn in screen space, so marks and strokes keep a readable size at any zoom.
 */
export default function ExploreCanvas({
  graph,
  labelOf,
  focusId,
  onFocus,
  highlightId,
  insets,
  keyboard,
  personal,
  toolbarStart,
  toolbarEnd,
  spotlight,
  only,
  trail,
}: {
  /** Set by filters or a collection: lit stay bright, 
ear half lit, everything else is dimmed. */
  spotlight?: { lit: Set<string>; near?: Set<string> } | null;
  /** Set by filters in their hiding mode: only these publications are drawn, with the topics and domains that still hold one. */
  only?: Set<string> | null;
  /** The walk so far, drawn as a dashed route through its steps. */
  trail?: string[];
  /** What the reader has read or shelved: lit in the overview, ringed everywhere. */
  personal?: Map<string, PersonalMark>;
  /** Controls placed in the map toolbar, before and after the camera buttons. */
  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  graph: ExploreGraph;
  labelOf: (node: ExploreNode) => string;
  focusId: string | null;
  onFocus: (id: string | null) => void;
  /** Lit from outside (a hovered row in a panel). */
  highlightId?: string | null;
  /** Screen space covered by floating panels; framing keeps clear of it. */
  insets: Insets;
  /** Global shortcuts (Esc, +, −, 0) are live. */
  keyboard: boolean;
}) {
  const { t } = useTranslation();
  const [wrapRef, { width, height }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const animRef = useRef<number | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const draggedRef = useRef(false);

  const commit = useCallback((next: Camera) => {
    cameraRef.current = next;
    setCamera(next);
  }, []);

  const stop = () => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  };

  /** The camera that frames `ids` inside the area the panels leave free. */
  const frame = useCallback(
    (ids: Iterable<string>, maxK = MAX_K): Camera | null => {
      if (!width || !height) return null;
      let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const id of ids) {
        const n = graph.byId.get(id);
        if (!n) continue;
        minX = Math.min(minX, n.x - n.r);
        maxX = Math.max(maxX, n.x + n.r);
        minY = Math.min(minY, n.y - n.r);
        maxY = Math.max(maxY, n.y + n.r);
      }
      if (!Number.isFinite(minX)) return null;
      // Panels only count where they leave room; on a narrow screen they overlay the map.
      const left = width - insets.left - insets.right > 280 ? insets.left : 0;
      const right = width - left - insets.right > 280 ? insets.right : 0;
      const top = insets.top;
      const bottom = height - top - insets.bottom > 220 ? insets.bottom : 0;
      const availW = Math.max(120, width - left - right - 96);
      const availH = Math.max(120, height - top - bottom - 96);
      const k = clampK(Math.min(maxK, availW / Math.max(maxX - minX, 1), availH / Math.max(maxY - minY, 1)));
      const cx = left + (width - left - right) / 2;
      const cy = top + (height - top - bottom) / 2;
      return { k, tx: cx - ((minX + maxX) / 2) * k, ty: cy - ((minY + maxY) / 2) * k };
    },
    [graph, width, height, insets]
  );

  /** Fly to a camera: zoom eases on a log scale, the screen centre's world point moves linearly. */
  const flyTo = useCallback(
    (target: Camera | null, duration = 750) => {
      if (!target) return;
      stop();
      const from = cameraRef.current;
      if (!from || prefersReducedMotion() || duration <= 0) {
        commit(target);
        return;
      }
      const sx = width / 2;
      const sy = height / 2;
      const c0 = { x: (sx - from.tx) / from.k, y: (sy - from.ty) / from.k };
      const c1 = { x: (sx - target.tx) / target.k, y: (sy - target.ty) / target.k };
      // A long hop dips out a little and back in, so the eye keeps its bearings.
      const dist = Math.hypot(c1.x - c0.x, c1.y - c0.y) * Math.min(from.k, target.k);
      const dip = Math.min(0.45, dist / Math.max(width, height));
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const e = ease(p);
        const k = Math.exp(Math.log(from.k) * (1 - e) + Math.log(target.k) * e) * (1 - dip * Math.sin(Math.PI * e));
        const x = c0.x + (c1.x - c0.x) * e;
        const y = c0.y + (c1.y - c0.y) * e;
        commit({ k, tx: sx - x * k, ty: sy - y * k });
        animRef.current = p < 1 ? requestAnimationFrame(tick) : null;
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [commit, width, height]
  );

  // Paint order: the reader's own publications above the rest, hubs on top.
  // What a hiding filter removes: publications that do not pass, then topics and domains left empty.
  const hidden = useMemo(() => {
    const out = new Set<string>();
    if (!only) return out;
    graph.nodes.forEach((n) => {
      if (n.kind === 'entry' && !only.has(n.id)) out.add(n.id);
    });
    graph.nodes.forEach((n) => {
      if (n.kind === 'topic' && n.children.every((id) => out.has(id))) out.add(n.id);
    });
    graph.nodes.forEach((n) => {
      if (n.kind !== 'domain') return;
      const unfiled = graph.nodes.some((e) => e.kind === 'entry' && !e.topicId && e.domainId === n.id && !out.has(e.id));
      if (!unfiled && n.children.every((id) => out.has(id))) out.add(n.id);
    });
    // Whatever is focused stays, so a link or a click never lands on nothing.
    if (focusId) out.delete(focusId);
    return out;
  }, [graph, only, focusId]);

  const order = useMemo(() => {
    const rank = (n: ExploreNode) => (n.kind !== 'entry' ? 2 : personal?.has(n.id) ? 1 : 0);
    return [...graph.nodes].sort((a, b) => rank(a) - rank(b));
  }, [graph, personal]);

  const allIds = useMemo(() => graph.nodes.map((n) => n.id), [graph]);
  const fitAll = useMemo(() => frame(allIds), [frame, allIds]);
  const focus = useMemo(() => focusSets(graph, focusId), [graph, focusId]);

  // The zoom that shows the whole library on this screen, panels ignored: stable while panels open and close.
  const baseK = useMemo(() => {
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const bw = Math.max(1, Math.max(...xs) - Math.min(...xs));
    const bh = Math.max(1, Math.max(...ys) - Math.min(...ys));
    return Math.max(0.05, Math.min((width || 1) / bw, (height || 1) / bh));
  }, [graph, width, height]);

  /** Where focus mode puts the camera. A publication with neighbours is centred close up (they bloom around it). */
  const focusCamera = useCallback(() => {
    if (!focus) return fitAll;
    if (focus.node.kind === 'entry' && graph.similar.get(focus.node.id)?.length) return frame([focus.node.id], baseK * 3.2);
    return frame(focus.primary, baseK * (focus.node.kind === 'entry' ? 3.2 : 4));
  }, [focus, fitAll, frame, graph, baseK]);

  // First paint: frame everything (or the deep-linked focus) without a flight.
  useEffect(() => {
    if (cameraRef.current || !fitAll) return;
    commit(focusCamera() ?? fitAll);
  }, [fitAll, focusCamera, commit]);

  // Every focus change flies: into the neighbourhood, or back out to the whole library.
  const lastFocus = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!cameraRef.current) return;
    if (lastFocus.current === undefined) {
      lastFocus.current = focusId;
      return;
    }
    if (lastFocus.current === focusId) return;
    lastFocus.current = focusId;
    flyTo(focusCamera());
  }, [focusId, focusCamera, flyTo]);

  // A panel opening or closing (or a resize) re-frames whatever is in view.
  const insetKey = `${insets.left}/${insets.right}/${insets.top}/${insets.bottom}/${width}/${height}`;
  const lastInsets = useRef(insetKey);
  useEffect(() => {
    if (!cameraRef.current || lastInsets.current === insetKey) return;
    lastInsets.current = insetKey;
    flyTo(focusCamera(), 450);
    // Only the inset/size change should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insetKey]);

  useEffect(() => stop, []);

  // A new arrangement morphs: every node glides from its old place to its new one while the camera re-frames.
  const prevGraph = useRef(graph);
  const [morph, setMorph] = useState<{ from: Map<string, { x: number; y: number }>; t: number } | null>(null);
  useEffect(() => {
    const prev = prevGraph.current;
    if (prev === graph) return;
    prevGraph.current = graph;
    flyTo(focusCamera(), 900);
    if (prefersReducedMotion()) return;
    const from = new Map(prev.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setMorph(p < 1 ? { from, t: ease(p) } : null);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Runs on a new graph only; focusCamera/flyTo are read fresh at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const zoomAt = useCallback(
    (factor: number, px: number, py: number, animate = false) => {
      const cam = cameraRef.current;
      if (!cam) return;
      const k = clampK(cam.k * factor);
      const next = { k, tx: px - ((px - cam.tx) / cam.k) * k, ty: py - ((py - cam.ty) / cam.k) * k };
      if (animate) flyTo(next, 320);
      else {
        stop();
        commit(next);
      }
    },
    [commit, flyTo]
  );

  // Wheel must be a native non-passive listener: React's onWheel cannot preventDefault.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      // Trackpad pinch arrives as ctrl+wheel with small deltas.
      const speed = e.ctrlKey ? 0.012 : 0.0018;
      zoomAt(Math.exp(-e.deltaY * speed), e.clientX - rect.left, e.clientY - rect.top);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Pointer pan and two-finger pinch. Capture starts only past the drag threshold so clicks on marks still land.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; dist?: number; captured: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    draggedRef.current = false;
    const pts = [...pointers.current.values()];
    gesture.current =
      pts.length === 2
        ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), captured: true }
        : { x: e.clientX, y: e.clientY, captured: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    // Released somewhere the svg never heard about (over a panel): end the gesture.
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      pointers.current.clear();
      gesture.current = null;
      return;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    const cam = cameraRef.current;
    if (!cam) return;
    if (pts.length >= 2 && g.dist) {
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = svgRef.current!.getBoundingClientRect();
      draggedRef.current = true;
      stop();
      const k = clampK(cam.k * (dist / g.dist));
      const px = mx - rect.left;
      const py = my - rect.top;
      commit({ k, tx: px - ((px - cam.tx) / cam.k) * k + (mx - g.x), ty: py - ((py - cam.ty) / cam.k) * k + (my - g.y) });
      gesture.current = { x: mx, y: my, dist, captured: true };
      return;
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.captured) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      g.captured = true;
      draggedRef.current = true;
      svgRef.current?.setPointerCapture(e.pointerId);
    }
    stop();
    commit({ ...cam, tx: cam.tx + dx, ty: cam.ty + dy });
    gesture.current = { ...g, x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    const rest = [...pointers.current.values()];
    gesture.current = rest.length === 1 ? { x: rest[0].x, y: rest[0].y, captured: true } : null;
  };

  const zoomButton = (factor: number) => zoomAt(factor, width / 2, height / 2, true);

  // One listener for the page's life; it reads the latest handler from a ref instead of
  // re-subscribing on every animation frame.
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  onKeyRef.current = (e: KeyboardEvent) => {
    if (!keyboard) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' && focusId) onFocus(null);
    else if (e.key === '+' || e.key === '=') zoomButton(1.5);
    else if (e.key === '-' || e.key === '_') zoomButton(1 / 1.5);
    else if (e.key === '0') flyTo(focusCamera());
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onKeyRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Bloom: in a publication's focus its content neighbours fan out around it (display only, the
  // layout is untouched), so close neighbours stop stacking and every title can be read.
  const bloomTargets = useMemo(() => {
    if (focus?.node.kind !== 'entry') return null;
    const center = focus.node;
    const near = graph.similar.get(center.id) ?? [];
    if (!near.length) return null;
    const items = near
      .map(({ id, score }, i) => {
        const n = graph.byId.get(id)!;
        const dx = n.x - center.x;
        const dy = n.y - center.y;
        const angle = Math.hypot(dx, dy) > 0.5 ? Math.atan2(dy, dx) : (i / near.length) * Math.PI * 2;
        return { id, score, angle, fixed: false };
      });
    // Straight down is reserved for the focused publication's own title.
    const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const reserved = [-0.55, 0, 0.55].map((d) => ({ id: '', score: 0, angle: Math.PI / 2 + d, fixed: true }));
    const ring = [...items.map((it) => ({ ...it, angle: norm(it.angle) })), ...reserved].sort((a, b) => a.angle - b.angle);
    // Push apart until every pair is at least this far apart around the circle.
    const minSep = (Math.PI * 2) / Math.max(ring.length, 5);
    for (let pass = 0; pass < 60; pass += 1) {
      for (let i = 0; i < ring.length; i += 1) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        let gap = b.angle - a.angle;
        if (i === ring.length - 1) gap += Math.PI * 2;
        if (gap < minSep && !(a.fixed && b.fixed)) {
          const push = minSep - gap;
          if (a.fixed) b.angle += push;
          else if (b.fixed) a.angle -= push;
          else {
            a.angle -= push / 2;
            b.angle += push / 2;
          }
        }
      }
    }
    // Closer by content = closer on screen.
    return new Map(
      ring.filter((it) => !it.fixed).map((it) => [it.id, { angle: it.angle, dist: 130 + (1 - Math.max(0, Math.min(1, it.score))) * 110 }])
    );
  }, [focus, graph]);

  const [bloom, setBloom] = useState(0);
  useEffect(() => {
    if (!bloomTargets) {
      setBloom(0);
      return;
    }
    if (prefersReducedMotion()) {
      setBloom(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      setBloom(ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setBloom(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bloomTargets]);

  const cam = camera;
  const zoom = cam ? cam.k / baseK : 1;
  // Marks keep their share of the layout: they shrink with the map, so a zoomed-out cluster never smears into a blob.
  const markScale = cam ? Math.min(cam.k * 0.85, 2.6) : 1;
  // The focused publication and its bloomed neighbours stay big enough to read.
  const bigScale = Math.min(2.6, Math.max(0.9, Math.sqrt(zoom) * 0.9));
  const worldX = (n: ExploreNode) => {
    const f = morph?.from.get(n.id);
    return f ? f.x + (n.x - f.x) * morph!.t : n.x;
  };
  const worldY = (n: ExploreNode) => {
    const f = morph?.from.get(n.id);
    return f ? f.y + (n.y - f.y) * morph!.t : n.y;
  };
  const rawX = (n: ExploreNode) => worldX(n) * cam!.k + cam!.tx;
  const rawY = (n: ExploreNode) => worldY(n) * cam!.k + cam!.ty;
  // A phone gets a tighter bloom so every neighbour stays on screen.
  const bloomScale = Math.min(1, Math.max(0.45, (width - insets.left - insets.right) / 620));
  const bloomed = (n: ExploreNode) => {
    const b = bloom > 0 && focus ? bloomTargets?.get(n.id) : undefined;
    return b ? { angle: b.angle, dist: b.dist * bloomScale } : undefined;
  };
  const sx = (n: ExploreNode) => {
    const b = bloomed(n);
    return b ? rawX(n) + (rawX(focus!.node) + Math.cos(b.angle) * b.dist - rawX(n)) * bloom : rawX(n);
  };
  const sy = (n: ExploreNode) => {
    const b = bloomed(n);
    return b ? rawY(n) + (rawY(focus!.node) + Math.sin(b.angle) * b.dist - rawY(n)) * bloom : rawY(n);
  };
  const inView = (x: number, y: number, pad = 60) => x > -pad && y > -pad && x < width + pad && y < height + pad;

  const lit = highlightId ?? hoverId;
  // The walk so far. In the overview it is the one thing to read: its steps are named and lit, the rest steps back.
  const trailNodes = (trail ?? []).map((id) => graph.byId.get(id)).filter((n): n is ExploreNode => !!n);
  const trailMode = trailNodes.length > 1 && !focus;
  const onTrail = (id: string) => trailNodes.length > 1 && trailNodes.some((n) => n.id === id);
  const litNode = lit ? graph.byId.get(lit) : undefined;
  const level = (id: string): 'focus' | 'primary' | 'secondary' | 'dim' | 'normal' => {
    if (!focus) return 'normal';
    if (id === focus.node.id) return 'focus';
    if (focus.primary.has(id)) return 'primary';
    if (focus.secondary.has(id)) return 'secondary';
    return 'dim';
  };
  const isMine = (id: string) => {
    const m = personal?.get(id);
    return !!(m?.readAt || m?.shelfAt);
  };
  // Around a publication, its topic siblings stay faint so the bloomed neighbours read first.
  const secondaryOpacity = focus?.node.kind === 'entry' && bloomTargets ? 0.22 : 0.5;
  // The overview is quiet: only what the reader has read or shelved is fully lit. Focus lights the rest.
  const entryOpacity = (n: ExploreNode) => {
    const lv = level(n.id);
    if (n.id === lit || lv === 'focus') return 1;
    if (trailMode) return onTrail(n.id) ? 1 : isMine(n.id) ? 0.4 : 0.2;
    const out = !!spotlight && !spotlight.lit.has(n.id);
    if (lv === 'primary') return out && !bloomed(n) ? 0.25 : 1;
    if (lv === 'secondary') return secondaryOpacity;
    if (lv === 'dim') return isMine(n.id) && !out ? 0.35 : 0.08;
    if (spotlight) return out ? (spotlight.near?.has(n.id) ? 0.45 : 0.07) : 1;
    // What a hiding filter leaves is the answer: shown at full strength.
    return isMine(n.id) || only ? 1 : 0.3;
  };
  const hubOpacity = (id: string) => ({ focus: 1, primary: 1, secondary: 0.6, dim: 0.16, normal: 1 })[level(id)];

  // Roads: one curve per pair of topics. The overview shows the main ones; a focus lights its own.
  const roadStyle = (road: ExploreRoad) => {
    const a = graph.byId.get(road.a)!;
    const b = graph.byId.get(road.b)!;
    const f = focus?.node;
    const hover =
      litNode && litNode.id !== f?.id
        ? litNode.kind === 'topic'
          ? road.a === litNode.id || road.b === litNode.id
          : litNode.kind === 'domain' && (a.domainId === litNode.id || b.domainId === litNode.id)
        : false;
    const wide = 1.5 + Math.min(5, road.links * 0.6);
    if (hover) return { stroke: UDC_CLASS.get(litNode!.cls)!.color, width: wide, opacity: 0.8, badge: false };
    if (f?.kind === 'topic') {
      if (road.a === f.id || road.b === f.id) {
        // The five strongest roads out of the topic are lit; the rest stay as thin traces.
        const other = road.a === f.id ? road.b : road.a;
        const top = (graph.relatedTopics.get(f.id) ?? []).slice(0, 5).some((r) => r.id === other);
        return top
          ? { stroke: UDC_CLASS.get(f.cls)!.color, width: 1.25 + Math.min(3, road.links * 0.4), opacity: 0.85, badge: true }
          : { stroke: 'var(--viz-ink-2)', width: 1, opacity: 0.25, badge: false };
      }
    } else if (f?.kind === 'domain') {
      const inA = a.domainId === f.id;
      const inB = b.domainId === f.id;
      if (inA !== inB) return { stroke: UDC_CLASS.get(f.cls)!.color, width: wide, opacity: 0.85, badge: false };
      if (inA && inB) return { stroke: 'var(--viz-ink-2)', width: 1 + Math.min(3, road.links * 0.35), opacity: 0.45, badge: false };
    }
    if (!road.main) return null;
    return { stroke: 'var(--viz-axis)', width: 1 + Math.min(3, road.links * 0.35), opacity: f ? 0.07 : trailMode ? 0.18 : 0.6, badge: false };
  };

  // Publication-to-publication lines appear only where the reader is looking.
  const lines: { key: string; a: ExploreNode; b: ExploreNode; stroke: string; width: number; opacity: number }[] = [];
  if (cam) {
    const seen = new Set<string>();
    const add = (id: string, style: (e: ExploreEdge, other: ExploreNode) => { stroke: string; width: number; opacity: number }) =>
      (graph.edgesOf.get(id) ?? []).forEach((e) => {
        const key = `${e.source}|${e.target}`;
        if (seen.has(key)) return;
        seen.add(key);
        const a = graph.byId.get(e.source)!;
        const b = graph.byId.get(e.target)!;
        if (hidden.has(a.id) || hidden.has(b.id)) return;
        lines.push({ key, a, b, ...style(e, a.id === id ? b : a) });
      });
    if (focus?.node.kind === 'entry') add(focus.node.id, (e) => ({ stroke: 'var(--viz-ink-2)', width: 1 + (e.score ?? 0.5) * 2.2, opacity: 0.9 }));
    if (litNode?.kind === 'entry') add(litNode.id, (e) => ({ stroke: 'var(--viz-ink-2)', width: 1 + (e.score ?? 0.5) * 1.5, opacity: 0.75 }));
    if (focus?.node.kind === 'topic') {
      const color = UDC_CLASS.get(focus.node.cls)!.color;
      // Links leaving the topic are what its roads already stand for.
      focus.node.children.forEach((id) => add(id, (_e, other) => ({ stroke: color, width: 1.25, opacity: other.topicId === focus.node.id ? 0.5 : 0 })));
    }
  }

  interface Label {
    key: string;
    x: number;
    y: number;
    text: string;
    count?: number;
    anchor: 'start' | 'middle' | 'end';
    size: number;
    upper?: boolean;
    bold?: boolean;
    pri: number;
    force?: boolean;
    faint?: boolean;
  }
  const labels: Label[] = [];
  const discs: React.ReactNode[] = [];

  const nodeEls =
    cam &&
    order.map((n) => {
      if (hidden.has(n.id)) return null;
      const x = sx(n);
      const y = sy(n);
      const def = UDC_CLASS.get(n.cls)!;
      const lv = level(n.id);
      const isFocus = lv === 'focus';
      const isLit = n.id === lit;
      const label = labelOf(n);
      const open = () => {
        if (draggedRef.current) return;
        onFocus(n.id === focusId ? null : n.id);
      };
      const common = {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': label,
        'aria-pressed': isFocus,
        className: 'cursor-pointer outline-none focus-visible:[&>.ring]:opacity-100',
        onMouseEnter: () => setHoverId(n.id),
        onMouseLeave: () => setHoverId((h) => (h === n.id ? null : h)),
        onFocus: () => setHoverId(n.id),
        onBlur: () => setHoverId((h) => (h === n.id ? null : h)),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          open();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFocus(n.id);
          }
        },
      };

      if (n.kind === 'entry') {
        if (!inView(x, y, 40)) return null;
        const mark = personal?.get(n.id);
        const mine = !!(mark?.readAt || mark?.shelfAt);
        const b = bloomed(n);
        const big = isFocus || (focus?.node.kind === 'entry' && lv === 'primary' && !!b);
        let r = Math.max(1.6, n.r * markScale);
        if (big) r = Math.max(r, n.r * bigScale * (isFocus ? 1.35 : 1));
        else if (mine || only || spotlight?.lit.has(n.id)) r = Math.max(r, 3.5);
        const step = trailMode && onTrail(n.id);
        if (step) r = Math.max(r, 5);

        const wantsLabel = step || isFocus || isLit || big || (mine && !focus && !trailMode && zoom > 1.5) || (mine && lv === 'primary') || (zoom > (focus?.node.kind === 'entry' ? 2.6 : 4.6) && lv !== 'dim' && lv !== 'secondary');
        if (wantsLabel) {
          const c = b ? Math.cos(b.angle) : 0;
          const s = b ? Math.sin(b.angle) : 1;
          labels.push({
            key: n.id,
            // A bloomed neighbour's title points away from the focused publication.
            x: b ? x + c * (r + 8) : x,
            y: b ? y + s * (r + 12) + 4 : y + r + 15,
            anchor: b ? (c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle') : 'middle',
            text: truncate(n.title ?? '', isFocus ? 32 : 34),
            size: isFocus ? 13 : 11,
            bold: isFocus,
            pri: isFocus ? 100 : isLit ? 95 : step ? 92 : big ? 90 : mine ? 30 : 10,
            force: step || isFocus || isLit || big,
          });
        }
        return (
          <g key={n.id} {...common}>
            <circle cx={x} cy={y} r={Math.max(r + 3, 7)} fill="transparent" />
            {isFocus && <circle cx={x} cy={y} r={r + 10} fill="none" stroke={def.color} strokeWidth={2} className="explore-pulse" />}
            <g className="transition-opacity duration-500" style={{ opacity: entryOpacity(n) }}>
              {r > 3 && <Mark shape={def.shape} x={x} y={y} r={r + 1.5} fill="var(--viz-surface)" />}
              <Mark shape={def.shape} x={x} y={y} r={r} fill={def.color} />
              {/* The reader's own layer: a full ring for read, a dashed one for on the shelf only. */}
              {mine && (
                <circle
                  cx={x}
                  cy={y}
                  r={r + 3}
                  fill="none"
                  stroke="var(--viz-ink)"
                  strokeWidth={1.4}
                  strokeDasharray={mark?.readAt ? undefined : '2.5 2.5'}
                />
              )}
            </g>
            <Mark
              shape={def.shape}
              x={x}
              y={y}
              r={r + 4}
              fill="none"
              className={twMerge('ring stroke-[var(--viz-ink)] [stroke-width:1.5] transition-opacity', isFocus || isLit ? 'opacity-100' : 'opacity-0')}
            />
          </g>
        );
      }

      if (n.kind === 'topic') {
        const r = Math.min(n.r * 1.8, Math.max(4.5, n.r * cam.k));
        const extent = n.extent && !morph ? n.extent * cam.k : 0;
        const hot = isFocus || isLit || (focus?.node.kind === 'entry' && focus.node.topicId === n.id);
        if (extent > 6) {
          // The topic as a place: its publications sit inside, and the whole disc is the click target.
          discs.push(
            <circle
              key={`disc-${n.id}`}
              cx={x}
              cy={y}
              r={extent}
              fill={def.color}
              fillOpacity={hot ? 0.1 : 0.045}
              stroke={def.color}
              strokeOpacity={hot ? 0.6 : 0.22}
              strokeWidth={hot ? 1.5 : 1}
              className="cursor-pointer transition-[fill-opacity,stroke-opacity,opacity] duration-300"
              style={{ opacity: lv === 'dim' ? 0.3 : 1 }}
              onMouseEnter={() => setHoverId(n.id)}
              onMouseLeave={() => setHoverId((h) => (h === n.id ? null : h))}
              onClick={(e) => {
                e.stopPropagation();
                if (!draggedRef.current && n.id !== focusId) onFocus(n.id);
              }}
            />
          );
        }
        if (lv !== 'dim' || isLit) {
          labels.push({
            key: n.id,
            x,
            y: y - Math.max(r + 7, extent + 8),
            anchor: 'middle',
            text: truncate(label, 30),
            count: only ? n.children.filter((id) => !hidden.has(id)).length : n.children.length,
            size: 12,
            bold: true,
            pri: isFocus ? 100 : isLit ? 95 : focus ? 60 : 40 + Math.min(30, n.children.length),
            force: isFocus || isLit || (trailMode && onTrail(n.id)),
            faint: lv === 'secondary' || (trailMode && !onTrail(n.id)),
          });
        }
        if (!inView(x, y, 40)) return null;
        return (
          <g key={n.id} {...common} style={{ opacity: hubOpacity(n.id) }}>
            <circle cx={x} cy={y} r={r + 5} fill="transparent" />
            <circle cx={x} cy={y} r={r} fill="var(--viz-surface)" stroke={def.color} strokeWidth={isFocus ? 3 : 1.75} strokeDasharray={def.shape === 'square' ? '5 3' : undefined} />
            <circle cx={x} cy={y} r={r * 0.42} fill={def.color} fillOpacity={0.85} />
            <circle cx={x} cy={y} r={r + 4} fill="none" className={twMerge('ring stroke-[var(--viz-ink)] [stroke-width:1.5] transition-opacity', isFocus || isLit ? 'opacity-100' : 'opacity-0')} />
          </g>
        );
      }

      const r = Math.min(34, Math.max(9, n.r * cam.k * 1.3));
      labels.push({
        key: n.id,
        x,
        y: y + r + 18,
        anchor: 'middle',
        text: truncate(label, 34),
        size: 12.5,
        upper: true,
        bold: true,
        pri: isFocus ? 100 : isLit ? 95 : lv === 'dim' ? 20 : 80,
        force: isFocus || isLit || (trailMode && onTrail(n.id)),
        faint: lv === 'dim' || (trailMode && !onTrail(n.id)),
      });
      if (!inView(x, y, 60)) return null;
      return (
        <g key={n.id} {...common} style={{ opacity: hubOpacity(n.id) }}>
          <circle cx={x} cy={y} r={r + 6} fill={def.color} fillOpacity={0.1} />
          <circle cx={x} cy={y} r={r} fill={def.color} fillOpacity={0.18} stroke={def.color} strokeWidth={isFocus ? 3 : 1.75} />
          <Mark shape={def.shape} x={x} y={y} r={r * 0.36} fill={def.color} />
          <circle cx={x} cy={y} r={r + 9} fill="none" className={twMerge('ring stroke-[var(--viz-ink)] [stroke-width:1.5] transition-opacity', isFocus || isLit ? 'opacity-100' : 'opacity-0')} />
        </g>
      );
    });

  // Labels never overlap: the most important one takes the spot, the rest wait for a closer zoom.
  const boxes: [number, number, number, number][] = [];
  const shown = labels
    .sort((a, b) => Number(!!b.force) - Number(!!a.force) || b.pri - a.pri)
    .filter((l) => {
      const w = l.text.length * l.size * (l.upper ? 0.74 : 0.57) + (l.count !== undefined ? 22 : 0) + 8;
      const x0 = l.anchor === 'middle' ? l.x - w / 2 : l.anchor === 'start' ? l.x - 4 : l.x - w + 4;
      const box: [number, number, number, number] = [x0, l.y - l.size - 2, x0 + w, l.y + 5];
      if (box[2] < 0 || box[0] > width || box[3] < 0 || box[1] > height) return false;
      if (!l.force && boxes.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) return false;
      boxes.push(box);
      return true;
    });

  const hovered = hoverId ? graph.byId.get(hoverId) : undefined;
  const hoveredMark = hovered ? personal?.get(hovered.id) : undefined;

  return (
    <div ref={wrapRef} className="viz-root absolute inset-0 overflow-hidden">
      {/* A soft dot grid that pans with the camera: the map reads as a surface, not a picture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
        style={
          cam
            ? {
                backgroundImage: 'radial-gradient(circle, var(--viz-grid) 1px, transparent 1.2px)',
                backgroundSize: `${28 * Math.max(0.6, Math.min(2, Math.sqrt(cam.k)))}px ${28 * Math.max(0.6, Math.min(2, Math.sqrt(cam.k)))}px`,
                backgroundPosition: `${cam.tx}px ${cam.ty}px`,
              }
            : undefined
        }
      />
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="application"
        aria-label={t('explore.canvas.ariaLabel', { count: graph.nodes.filter((n) => n.kind === 'entry').length })}
        className="absolute inset-0 block touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => {
          if (e.target === svgRef.current && !draggedRef.current && focusId) onFocus(null);
        }}
        onDoubleClick={(e) => {
          if (e.target !== svgRef.current) return;
          const rect = svgRef.current!.getBoundingClientRect();
          zoomAt(1.8, e.clientX - rect.left, e.clientY - rect.top, true);
        }}
      >
        {cam && (
          <>
            <g>{discs}</g>

            <g className="pointer-events-none" fill="none" strokeLinecap="round">
              {graph.roads.map((road) => {
                const style = roadStyle(road);
                if (!style || hidden.has(road.a) || hidden.has(road.b)) return null;
                const a = graph.byId.get(road.a)!;
                const b = graph.byId.get(road.b)!;
                const [x1, y1, x2, y2] = [sx(a), sy(a), sx(b), sy(b)];
                const cx = (x1 + x2) / 2 - (y2 - y1) * 0.12;
                const cy = (y1 + y2) / 2 + (x2 - x1) * 0.12;
                return (
                  <g key={`${road.a}|${road.b}`}>
                    <path
                      d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`}
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeOpacity={style.opacity}
                      className="transition-[stroke-opacity] duration-500"
                    />
                    {/* How many publication pairs carry this road. */}
                    {style.badge && Math.hypot(x2 - x1, y2 - y1) > 90 && (
                      <g className="animate-fade-in">
                        <circle cx={(x1 + 2 * cx + x2) / 4} cy={(y1 + 2 * cy + y2) / 4} r={9} fill="var(--viz-surface)" stroke={style.stroke} />
                        <text
                          x={(x1 + 2 * cx + x2) / 4}
                          y={(y1 + 2 * cy + y2) / 4 + 3.5}
                          textAnchor="middle"
                          stroke="none"
                          className="fill-[var(--viz-ink-2)] text-[10px] font-semibold tabular-nums"
                        >
                          {road.links}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Where the focus belongs: a publication to its topic, a domain to its topics. */}
              {focus?.node.kind === 'entry' && focus.node.topicId && (
                <line
                  x1={sx(focus.node)}
                  y1={sy(focus.node)}
                  x2={sx(graph.byId.get(focus.node.topicId)!)}
                  y2={sy(graph.byId.get(focus.node.topicId)!)}
                  stroke={UDC_CLASS.get(focus.node.cls)!.color}
                  strokeWidth={1.25}
                  strokeDasharray="3 4"
                  strokeOpacity={0.7}
                />
              )}
              {focus?.node.kind === 'domain' &&
                focus.node.children.map((id) => {
                  const topic = graph.byId.get(id)!;
                  return (
                    <line
                      key={`spoke-${id}`}
                      x1={sx(focus.node)}
                      y1={sy(focus.node)}
                      x2={sx(topic)}
                      y2={sy(topic)}
                      stroke={UDC_CLASS.get(focus.node.cls)!.color}
                      strokeWidth={1}
                      strokeDasharray="3 4"
                      strokeOpacity={0.5}
                    />
                  );
                })}

              {lines.map((l) => (
                <line key={l.key} x1={sx(l.a)} y1={sy(l.a)} x2={sx(l.b)} y2={sy(l.b)} stroke={l.stroke} strokeWidth={l.width} strokeOpacity={l.opacity} className="animate-fade-in" />
              ))}
            </g>

            {/* How close, written on the focused publication's own links. */}
            {focus?.node.kind === 'entry' && (
              <g className="pointer-events-none">
                {(graph.similar.get(focus.node.id) ?? []).map(({ id, score }) => {
                  const a = focus.node;
                  const b = graph.byId.get(id)!;
                  const x = (sx(a) + sx(b)) / 2;
                  const y = (sy(a) + sy(b)) / 2;
                  if (Math.hypot(sx(a) - sx(b), sy(a) - sy(b)) < 70) return null;
                  return (
                    <g key={`score-${id}`} className="animate-fade-in">
                      <rect x={x - 17} y={y - 9} width={34} height={18} rx={9} fill="var(--viz-surface)" stroke="var(--viz-axis)" />
                      <text x={x} y={y + 3.5} textAnchor="middle" className="fill-[var(--viz-ink-2)] text-[10px] font-semibold tabular-nums">
                        {Math.round(score * 100)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* The reading trail: the walk so far as a dashed route, each step numbered. */}
            {trailNodes.length > 1 && (
              <g className="pointer-events-none">
                <polyline
                  points={trailNodes.map((n) => `${sx(n)},${sy(n)}`).join(' ')}
                  fill="none"
                  stroke="var(--viz-ink)"
                  strokeWidth={trailMode ? 2.25 : 1.75}
                  strokeOpacity={trailMode ? 0.95 : 0.5}
                  strokeDasharray={trailMode ? '7 5' : '1 7'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            <g>{nodeEls}</g>

            {trailNodes.length > 1 && (
              <g className="pointer-events-none">
                {trailNodes.map((n, i) => (
                  <g key={`step-${n.id}-${i}`}>
                    <circle cx={sx(n) + 9} cy={sy(n) - 9} r={7} fill="var(--viz-ink)" />
                    <text x={sx(n) + 9} y={sy(n) - 5.8} textAnchor="middle" className="fill-[var(--viz-surface)] text-[9px] font-bold tabular-nums">
                      {i + 1}
                    </text>
                  </g>
                ))}
              </g>
            )}

            <g className="pointer-events-none">
              {shown.map((l) => (
                <text
                  key={`label-${l.key}`}
                  x={l.x}
                  y={l.y}
                  textAnchor={l.anchor}
                  fontSize={l.size}
                  opacity={l.faint ? 0.42 : 1}
                  className={twMerge(
                    'fill-[var(--viz-ink)] [paint-order:stroke] [stroke-linejoin:round] [stroke-width:4px] stroke-[var(--viz-surface)]',
                    l.bold ? 'font-semibold' : 'font-medium',
                    l.upper && 'font-extrabold uppercase tracking-wide'
                  )}
                >
                  {l.text}
                  {l.count !== undefined && <tspan className="fill-[var(--viz-muted)] font-normal tabular-nums"> {l.count}</tspan>}
                </text>
              ))}
            </g>
          </>
        )}
      </svg>

      {/* Hover card: only for publications, and not for the one the panel already describes. */}
      {cam && hovered && hovered.kind === 'entry' && hovered.id !== focusId && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-800/95"
          style={{
            left: Math.min(Math.max(sx(hovered) + 16, 8), width - 280),
            top: sy(hovered) > height - 120 ? sy(hovered) - 100 : sy(hovered) + 16,
          }}
        >
          <p className="font-semibold text-[color:var(--viz-ink)]">{hovered.title}</p>
          <p className="mt-0.5 text-[color:var(--viz-ink-2)]">
            {hovered.topicId ? labelOf(graph.byId.get(hovered.topicId)!) : labelOf(graph.byId.get(hovered.domainId!)!)}
            {hovered.pages ? ` · ${t('explore.map.pages', { count: hovered.pages })}` : ''}
          </p>
          <PersonalStatus mark={hoveredMark} className="mt-0.5" />
          <p className="mt-0.5 text-[color:var(--viz-muted)]">
            {t('explore.map.neighbours', { count: graph.similar.get(hovered.id)?.length ?? 0 })} · {t('explore.canvas.clickToFocus')}
          </p>
        </div>
      )}

      {/* One toolbar for the map: arrangement, camera, help. Bottom left, clear of the panels and the assistant launcher. */}
      <div
        className="absolute z-20 flex h-10 items-center justify-between gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
        // Sits under the left panel, flush with its edges, so the two read as one column.
        style={{ left: 16, bottom: insets.bottom + 16, width: insets.left > 16 && width > 900 ? insets.left - 16 : undefined }}
      >
        {toolbarStart}
        {toolbarStart && <span aria-hidden className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />}
        {[
          { label: t('explore.canvas.zoomIn'), icon: <FiPlus />, run: () => zoomButton(1.6) },
          { label: t('explore.canvas.zoomOut'), icon: <FiMinus />, run: () => zoomButton(1 / 1.6) },
          { label: t('explore.canvas.fit'), icon: <FiMaximize />, run: () => (focusId ? onFocus(null) : flyTo(fitAll)) },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.label}
            aria-label={b.label}
            onClick={b.run}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {b.icon}
          </button>
        ))}
        {toolbarEnd && <span aria-hidden className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />}
        {toolbarEnd}
      </div>
    </div>
  );
}
