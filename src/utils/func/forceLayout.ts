export interface LayoutNode {
  id: string;
  /** Collision radius. */
  r: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
  /** 0–1: stronger edges pull harder. */
  weight?: number;
}

export interface Point {
  x: number;
  y: number;
}

/** A stable pseudo-random in [0, 1) from a string, so the same data always lays out the same. */
const hash01 = (value: string, salt: number): number => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

/**
 * Deterministic force-directed layout (repulsion, springs on edges, centring gravity, collision),
 * run to rest up front. Sized for the library map (a few hundred nodes); O(n²) per step.
 * Returns positions centred on (0, 0); the caller scales them into its viewport.
 */
export function forceLayout(nodes: LayoutNode[], edges: LayoutEdge[], iterations = 320): Map<string, Point> {
  const n = nodes.length;
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const spread = Math.sqrt(n) * 40;
  const x = nodes.map((node) => (hash01(node.id, 1) - 0.5) * spread);
  const y = nodes.map((node) => (hash01(node.id, 2) - 0.5) * spread);
  const links = edges
    .map((edge) => [index.get(edge.source), index.get(edge.target), edge.weight ?? 1] as const)
    .filter((link): link is readonly [number, number, number] => link[0] !== undefined && link[1] !== undefined);

  // Short-range repulsion (like d3's `distanceMax`) so linked groups pull into visible clusters
  // instead of every node spreading evenly over a disc.
  const repulsion = 520;
  const repulsionRange2 = 110 * 110;
  const springLength = 26;
  const gravity = 0.018;

  for (let step = 0; step < iterations; step += 1) {
    const cooling = 1 - step / iterations;
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);

    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let ex = x[i] - x[j];
        let ey = y[i] - y[j];
        let d2 = ex * ex + ey * ey;
        if (d2 < 0.01) {
          ex = hash01(nodes[i].id, step) - 0.5;
          ey = hash01(nodes[j].id, step) - 0.5;
          d2 = 0.5;
        }
        const minGap0 = nodes[i].r + nodes[j].r + 3;
        if (d2 > repulsionRange2 && d2 > minGap0 * minGap0) continue;
        const d = Math.sqrt(d2);
        let force = repulsion / d2;
        const minGap = nodes[i].r + nodes[j].r + 3;
        if (d < minGap) force += (minGap - d) * 0.6;
        const fx = (ex / d) * force;
        const fy = (ey / d) * force;
        dx[i] += fx;
        dy[i] += fy;
        dx[j] -= fx;
        dy[j] -= fy;
      }
    }

    for (const [a, b, weight] of links) {
      const ex = x[b] - x[a];
      const ey = y[b] - y[a];
      const d = Math.sqrt(ex * ex + ey * ey) || 0.01;
      const force = (d - springLength) * 0.1 * (0.5 + weight);
      const fx = (ex / d) * force;
      const fy = (ey / d) * force;
      dx[a] += fx;
      dy[a] += fy;
      dx[b] -= fx;
      dy[b] -= fy;
    }

    const maxMove = 12 * cooling + 0.5;
    for (let i = 0; i < n; i += 1) {
      dx[i] -= x[i] * gravity;
      dy[i] -= y[i] * gravity;
      const move = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);
      const scale = move > maxMove ? maxMove / move : 1;
      x[i] += dx[i] * scale;
      y[i] += dy[i] * scale;
    }
  }

  return new Map(nodes.map((node, i) => [node.id, { x: x[i], y: y[i] }]));
}
