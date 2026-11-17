import { useSyncExternalStore } from 'react';
import { config } from '@/lib/config';

/**
 * Portal features an administrator switches on or off at runtime (elvira-portal: KU minimal instance).
 *
 * Each feature resolves in three layers; the first that says "off" wins (the same model as the catalog's
 * console modules, `apps/console/modules.py`):
 *
 * 1. **capability** — what the catalog deployment can serve (`EVILFLOWERS_ASSISTANT_ENABLED`, an embedding
 *    URL, Readium LCP …). A feature whose capability the catalog reports as off is never shown.
 * 2. **setting** — the instance setting `portal.features` (`{ "<key>": true|false }`), stored through the
 *    catalog settings API (`PUT /api/v1/settings/portal.features`) from Administration › Features.
 * 3. **build default** — `ELVIRA_FEATURES` (`assistant=off,graph=on`), else the experimental flag for
 *    experimental features, else on.
 *
 * The catalog serves layers 1–2 to every reader through `GET /api/v1/settings?public=true&include=capabilities` (#212, linked
 * from the admin page). Until it exists, or while it is unreachable, the build defaults apply. The last
 * answer is kept in localStorage so a reload does not flash features that are off.
 */

export const FEATURE_KEYS = [
  'assistant',
  'graph',
  'passageSearch',
  'contentInsights',
  'themedFeed',
  'lending',
  'help',
  'interop',
  'contentPolicies',
  'instanceSettings',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Catalog capabilities a feature can depend on (reported by the catalog, see `IPublicSettings`). */
export type Capability = 'assistant' | 'extraction' | 'hybrid_search' | 'lcp' | 'graph' | 'harvest';

export interface FeatureDefinition {
  key: FeatureKey;
  /** Reader-facing or administration-only. */
  area: 'reader' | 'admin';
  /** Built ahead of the catalog: off unless `ELVIRA_EXPERIMENTAL_FEATURES` (or a setting) turns it on. */
  experimental?: boolean;
  /** Catalog capabilities it needs; one reported off hides it. */
  requires?: Capability[];
}

export const FEATURES: FeatureDefinition[] = [
  { key: 'assistant', area: 'reader', requires: ['assistant'] },
  { key: 'graph', area: 'reader', experimental: true, requires: ['graph'] },
  { key: 'passageSearch', area: 'reader', requires: ['extraction'] },
  // Contents / related / figures tabs of a publication and the figures tab of the search.
  { key: 'contentInsights', area: 'reader', experimental: true, requires: ['extraction'] },
  { key: 'themedFeed', area: 'reader', experimental: true },
  { key: 'lending', area: 'reader', requires: ['lcp'] },
  { key: 'help', area: 'reader', experimental: true },
  { key: 'interop', area: 'admin', requires: ['harvest'] },
  { key: 'contentPolicies', area: 'admin', experimental: true },
  { key: 'instanceSettings', area: 'admin', experimental: true },
];

export const FEATURE_BY_KEY = Object.fromEntries(FEATURES.map((f) => [f.key, f])) as Record<FeatureKey, FeatureDefinition>;

export const isFeatureKey = (value: string): value is FeatureKey => (FEATURE_KEYS as readonly string[]).includes(value);

/** The catalog setting holding the switches. */
export const FEATURES_SETTING_KEY = 'portal.features';

/** `ELVIRA_FEATURES=assistant=off,graph=on` (also `-assistant` / `+graph`). Unknown keys are ignored. */
export const parseFeatureList = (raw: string | undefined): Partial<Record<FeatureKey, boolean>> => {
  const result: Partial<Record<FeatureKey, boolean>> = {};
  for (const part of (raw ?? '').split(',')) {
    const item = part.trim();
    if (!item) continue;
    let key = item;
    let on = true;
    if (item.startsWith('-') || item.startsWith('+')) {
      on = item.startsWith('+');
      key = item.slice(1);
    } else if (item.includes('=')) {
      const [k, v] = item.split('=');
      key = k.trim();
      on = !['off', 'false', '0', 'no'].includes(v.trim().toLowerCase());
    }
    if (isFeatureKey(key)) result[key] = on;
  }
  return result;
};

// Build-time values, or the deployment's /config.json when it sets them (#61).
const EXPERIMENTAL = config.ELVIRA_EXPERIMENTAL_FEATURES === 'true';
const BUILD_OVERRIDES = parseFeatureList(config.ELVIRA_FEATURES);

/** What the build says, without the catalog. */
export const buildDefault = (key: FeatureKey): boolean => {
  if (key in BUILD_OVERRIDES) return !!BUILD_OVERRIDES[key];
  return FEATURE_BY_KEY[key].experimental ? EXPERIMENTAL : true;
};

export type FeatureSource = 'capability' | 'setting' | 'build';

export interface FeatureState {
  key: FeatureKey;
  enabled: boolean;
  /** The catalog can serve it (unknown capabilities count as available). */
  available: boolean;
  /** What the setting asks for, if it says anything. */
  stored?: boolean;
  /** What applies without a setting. */
  fallback: boolean;
  source: FeatureSource;
  /** The capability that is off, when `available` is false. */
  missing?: Capability;
}

/** What the catalog tells every reader (`GET /api/v1/settings?public=true&include=capabilities`, #212). */
export interface IPublicSettings {
  /** The public keys, in the admin listing's item shape; `portal.features` is one of them. */
  response?: { key: string; value: unknown; public?: boolean }[];
  /** Capability → whether the deployment serves it. A capability not listed is unknown (treated as on). */
  capabilities?: Partial<Record<Capability, boolean>> | null;
}

export interface FeatureSnapshot {
  stored: Partial<Record<FeatureKey, boolean>>;
  capabilities: Partial<Record<Capability, boolean>>;
  /** Whether the catalog answered (now or in the cached copy). */
  fromCatalog: boolean;
}

export const toStored = (value: unknown): Partial<Record<FeatureKey, boolean>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Partial<Record<FeatureKey, boolean>> = {};
  for (const [key, on] of Object.entries(value as Record<string, unknown>)) {
    if (isFeatureKey(key) && typeof on === 'boolean') result[key] = on;
  }
  return result;
};

export const resolveFeature = (key: FeatureKey, snapshot: FeatureSnapshot): FeatureState => {
  const fallback = buildDefault(key);
  const missing = (FEATURE_BY_KEY[key].requires ?? []).find((cap) => snapshot.capabilities[cap] === false);
  const stored = snapshot.stored[key];
  if (missing) return { key, enabled: false, available: false, stored, fallback, source: 'capability', missing };
  if (stored !== undefined) return { key, enabled: stored, available: true, stored, fallback, source: 'setting' };
  return { key, enabled: fallback, available: true, fallback, source: 'build' };
};

// ── The store: module scope, so non-React code (route tables, the guide registry) reads it too ─────────────

const CACHE_KEY = `elvira.features:${config.ELVIRA_BASE_URL}`;

const readCache = (): FeatureSnapshot => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FeatureSnapshot;
      return { stored: toStored(parsed.stored), capabilities: parsed.capabilities ?? {}, fromCatalog: !!parsed.fromCatalog };
    }
  } catch {
    // Private mode, blocked storage or a broken entry: the build defaults apply.
  }
  return { stored: {}, capabilities: {}, fromCatalog: false };
};

let snapshot: FeatureSnapshot = readCache();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getFeatureSnapshot = () => snapshot;

/** Replace what the catalog said (from the public settings listing, or the admin's own save). */
export const setFeatureSnapshot = (next: FeatureSnapshot) => {
  if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
  snapshot = next;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // Not persisted; the next load fetches again.
  }
  listeners.forEach((listener) => listener());
};

// Whether the first catalog read of this page load is over (answered, refused or failed). Until then a
// route of a switched-off feature waits instead of answering 404: a deep link to a feature only the
// setting turns on must not bounce a first-time visitor.
let settled = false;
const settledListeners = new Set<() => void>();
export const markFeaturesSettled = () => {
  if (settled) return;
  settled = true;
  settledListeners.forEach((listener) => listener());
};
export const useFeaturesSettled = () =>
  useSyncExternalStore(
    (listener) => {
      settledListeners.add(listener);
      return () => settledListeners.delete(listener);
    },
    () => settled,
    () => settled
  );

/** Non-React read (route tables, the guide registry, event handlers). Re-evaluated on each call. */
export const isFeatureOn = (key: FeatureKey) => resolveFeature(key, snapshot).enabled;

/** All features with where their state comes from (Administration › Features). */
export const featureStates = (snap: FeatureSnapshot = snapshot) => FEATURES.map((f) => resolveFeature(f.key, snap));

/** Re-renders when the catalog's answer changes. */
export const useFeatureSnapshot = () => useSyncExternalStore(subscribe, getFeatureSnapshot, getFeatureSnapshot);

export const useFeature = (key: FeatureKey) => {
  const snap = useFeatureSnapshot();
  return resolveFeature(key, snap).enabled;
};
