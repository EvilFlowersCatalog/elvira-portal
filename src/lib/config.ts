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
