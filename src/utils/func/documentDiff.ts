/** One leaf that differs between two JSON documents, by dotted path (`tiers.past_loan`, `grants.license_states`). */
export interface IDocumentChange {
  path: string;
  before: unknown;
  after: unknown;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** Leaves of a document by path; arrays count as one value (a changed list shows whole, not item by item). */
const flatten = (value: unknown, prefix = '', out = new Map<string, unknown>()) => {
  if (isPlainObject(value) && Object.keys(value).length) {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else if (prefix) {
    out.set(prefix, value);
  }
  return out;
};

/** What changed from `before` to `after`, sorted by path. */
export const documentDiff = (before: unknown, after: unknown): IDocumentChange[] => {
  const a = flatten(before);
  const b = flatten(after);
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
  return paths
    .filter((path) => JSON.stringify(a.get(path)) !== JSON.stringify(b.get(path)))
    .map((path) => ({ path, before: a.get(path), after: b.get(path) }));
};
