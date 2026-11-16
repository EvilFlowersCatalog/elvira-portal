export interface WeightedEdge {
  source: string;
  target: string;
  weight: number;
}

/**
 * Louvain community detection (Blondel et al. 2008) on a weighted, undirected graph.
 *
 * Deterministic: nodes are visited in the order given and ties keep the current community, so the
 * same graph always yields the same partition. Sized for the library map (hundreds of nodes).
 *
 * Returns a community index per node id, numbered by community size (0 = largest). A node with no
 * edges is its own community.
 */
export function louvain(ids: string[], edges: WeightedEdge[], resolution = 1): Map<string, number> {
  const index = new Map(ids.map((id, i) => [id, i]));
  // Level-0 graph as adjacency maps over integer node ids.
  let adj: Map<number, number>[] = ids.map(() => new Map());
  edges.forEach((e) => {
    const a = index.get(e.source);
    const b = index.get(e.target);
    if (a === undefined || b === undefined || a === b) return;
    adj[a].set(b, (adj[a].get(b) ?? 0) + e.weight);
    adj[b].set(a, (adj[b].get(a) ?? 0) + e.weight);
  });
  let selfLoops = ids.map(() => 0);
  // membership[original node] = node of the current level
  let membership = ids.map((_, i) => i);

  for (let level = 0; level < 20; level += 1) {
    const n = adj.length;
    const degree = adj.map((nbrs, i) => [...nbrs.values()].reduce((s, w) => s + w, 0) + 2 * selfLoops[i]);
    const m2 = degree.reduce((s, d) => s + d, 0);
    if (m2 === 0) break;

    const community = Array.from({ length: n }, (_, i) => i);
    const total = [...degree];
    let moved = false;

    for (let pass = 0; pass < 50; pass += 1) {
      let changed = false;
      for (let i = 0; i < n; i += 1) {
        const own = community[i];
        // Weight from i into each neighbouring community.
        const into = new Map<number, number>();
        adj[i].forEach((w, j) => {
          into.set(community[j], (into.get(community[j]) ?? 0) + w);
        });
        total[own] -= degree[i];
        const gain = (c: number) => (into.get(c) ?? 0) - (resolution * total[c] * degree[i]) / m2;
        let best = own;
        let bestGain = gain(own);
        into.forEach((_, c) => {
          const g = gain(c);
          if (g > bestGain + 1e-12) {
            best = c;
            bestGain = g;
          }
        });
        total[best] += degree[i];
        if (best !== own) {
          community[i] = best;
          changed = true;
          moved = true;
        }
      }
      if (!changed) break;
    }
    if (!moved) break;

    // Aggregate: every community becomes a node of the next level.
    const renumber = new Map<number, number>();
    community.forEach((c) => {
      if (!renumber.has(c)) renumber.set(c, renumber.size);
    });
    const next: Map<number, number>[] = Array.from({ length: renumber.size }, () => new Map());
    const nextSelf = Array.from({ length: renumber.size }, () => 0);
    adj.forEach((nbrs, i) => {
      const ci = renumber.get(community[i])!;
      nextSelf[ci] += selfLoops[i];
      nbrs.forEach((w, j) => {
        const cj = renumber.get(community[j])!;
        if (ci === cj) {
          if (i < j) nextSelf[ci] += w;
        } else next[ci].set(cj, (next[ci].get(cj) ?? 0) + w);
      });
    });
    membership = membership.map((node) => renumber.get(community[node])!);
    adj = next;
    selfLoops = nextSelf;
  }

  // Number communities by size, largest first (ties by first appearance) — stable labels for the UI.
  const sizes = new Map<number, number>();
  membership.forEach((c) => sizes.set(c, (sizes.get(c) ?? 0) + 1));
  const order = [...sizes.keys()].sort((a, b) => sizes.get(b)! - sizes.get(a)! || a - b);
  const rank = new Map(order.map((c, i) => [c, i]));
  return new Map(ids.map((id, i) => [id, rank.get(membership[i])!]));
}
