/**
 * Portal configuration (elvira-portal#61): build once per commit, configure per deployment.
 *
 * The build-time `ELVIRA_*` values (env/.env.<mode>, CI variables) are the defaults. Before the app
 * renders, main.tsx calls `loadRuntimeConfig()`, which fetches `/config.json` (mounted by ops next
 * to the image). Its keys override the defaults. A missing or invalid file (404, the SPA fallback's
 * index.html, broken JSON) leaves the defaults unchanged, so `npm run dev` and the static deploys
 * keep working.
 *
 * Read every value through `config` (`config.ELVIRA_BASE_URL`), never `import.meta.env.ELVIRA_*`.
 * Modules that read it at load time are fine: everything except forceHttps is imported only after
 * the runtime config has loaded (main.tsx -> bootstrap.tsx).
 */

export interface PortalConfig {
  ELVIRA_BASE_URL: string;
  ELVIRA_CATALOG_ID: string;
  ELVIRA_THEME: string;
  ELVIRA_FEATURES: string;
  ELVIRA_EXPERIMENTAL_FEATURES: string;
  ELVIRA_FEATURED_FEED_ID: string;
  ELVIRA_UMAMI_SERVER: string;
  ELVIRA_UMAMI_WEBSITE: string;
  ELVIRA_FARO_URL: string;
  ELVIRA_FARO_API_KEY: string;
  ELVIRA_FARO_ENVIRONMENT: string;
  ELVIRA_FARO_SAMPLE_RATE: string;
  ELVIRA_VIEWER_STREAMING: string;
  ELVIRA_VIEWER_RANGE_CHUNK_SIZE: string;
  ELVIRA_VIEWER_AUTO_FETCH: string;
}

const env = import.meta.env;

/** Listed one by one: Vite only inlines `import.meta.env.X` written out in full. */
const BUILD_DEFAULTS: PortalConfig = {
  ELVIRA_BASE_URL: env.ELVIRA_BASE_URL ?? '',
  ELVIRA_CATALOG_ID: env.ELVIRA_CATALOG_ID ?? '',
  ELVIRA_THEME: env.ELVIRA_THEME ?? '',
  ELVIRA_FEATURES: env.ELVIRA_FEATURES ?? '',
  ELVIRA_EXPERIMENTAL_FEATURES: env.ELVIRA_EXPERIMENTAL_FEATURES ?? '',
  ELVIRA_FEATURED_FEED_ID: env.ELVIRA_FEATURED_FEED_ID ?? '',
  ELVIRA_UMAMI_SERVER: env.ELVIRA_UMAMI_SERVER ?? '',
  ELVIRA_UMAMI_WEBSITE: env.ELVIRA_UMAMI_WEBSITE ?? '',
  ELVIRA_FARO_URL: env.ELVIRA_FARO_URL ?? '',
  ELVIRA_FARO_API_KEY: env.ELVIRA_FARO_API_KEY ?? '',
  ELVIRA_FARO_ENVIRONMENT: env.ELVIRA_FARO_ENVIRONMENT ?? '',
  ELVIRA_FARO_SAMPLE_RATE: env.ELVIRA_FARO_SAMPLE_RATE ?? '',
  ELVIRA_VIEWER_STREAMING: env.ELVIRA_VIEWER_STREAMING ?? '',
  ELVIRA_VIEWER_RANGE_CHUNK_SIZE: env.ELVIRA_VIEWER_RANGE_CHUNK_SIZE ?? '',
  ELVIRA_VIEWER_AUTO_FETCH: env.ELVIRA_VIEWER_AUTO_FETCH ?? '',
};

const isOn = (value: string, fallback: boolean): boolean =>
  value === '' ? fallback : /^(1|true|on|yes)$/i.test(value.trim());

/**
 * How the reader loads the PDF (elvira-portal#63), from ELVIRA_VIEWER_*:
 * - `streaming`: hand the viewer a URL it range-loads (first page before the last byte) instead of
 *   downloading the whole file first. Off by default; enable per instance.
 * - `rangeChunkSize`: bytes per Range request (default 256 KiB).
 * - `autoFetch`: after the first page, fetch the rest in the background (default on). Off means
 *   range-only reading, best for huge scans; search, print and download then fetch many ranges.
 * Read when the reader opens, after the runtime config has loaded.
 */
export const viewerLoading = () => {
  const chunk = Number(config.ELVIRA_VIEWER_RANGE_CHUNK_SIZE);
  return {
    streaming: isOn(config.ELVIRA_VIEWER_STREAMING, false),
    rangeChunkSize: Number.isInteger(chunk) && chunk >= 65536 ? chunk : 262144,
    autoFetch: isOn(config.ELVIRA_VIEWER_AUTO_FETCH, true),
  };
};

/** The effective configuration. Mutated once, by `loadRuntimeConfig`, before the app is imported. */
export const config: Readonly<PortalConfig> = { ...BUILD_DEFAULTS };

/** Where the values came from: shown nowhere, but handy in the console (`__ELVIRA_CONFIG__`). */
export let configSource: 'build' | 'runtime' = 'build';

const isKey = (key: string): key is keyof PortalConfig => key in BUILD_DEFAULTS;

/** Applies the known keys of a parsed config.json. Numbers and booleans are accepted as strings. */
export const applyRuntimeConfig = (raw: unknown): number => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0;
  let applied = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isKey(key)) continue;
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    (config as PortalConfig)[key] = String(value);
    applied += 1;
  }
  return applied;
};

/** How long a slow config.json may hold the first render before the build defaults are used. */
const LOAD_TIMEOUT_MS = 3000;

export const loadRuntimeConfig = async (): Promise<void> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);
    const response = await fetch('/config.json', { cache: 'no-cache', signal: controller.signal });
    clearTimeout(timer);
    // The SPA fallback answers unknown paths with index.html (200, text/html): not a config.
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('json')) return;
    if (applyRuntimeConfig(await response.json()) > 0) configSource = 'runtime';
  } catch {
    // Missing, slow or invalid: the build-time values stay.
  } finally {
    (window as unknown as { __ELVIRA_CONFIG__?: unknown }).__ELVIRA_CONFIG__ = { source: configSource };
  }
};
