/**
 * Browser telemetry (elvira-portal#39, #58, #59, #60; IP-029): Grafana Faro Web SDK with tracing.
 *
 * Imported for its side effect first in bootstrap.tsx, after the runtime config (#61) has loaded and
 * before any other module can capture fetch and XHR. A no-op when ELVIRA_FARO_URL is empty (local dev,
 * instances without a receiver): nothing is patched or sent, and every helper exported below returns
 * without doing anything. Components never call `faro.api` themselves; they use ./analytics.
 *
 * - `traceparent` goes only to the catalog API origin (ELVIRA_BASE_URL), never to third parties.
 * - Each route change (and the initial page load) opens a `route <pattern>` span and sets the Faro view
 *   to the same pattern, so every record carries `view_name` (#58). API calls the screen starts within
 *   ROUTE_GROUP_MS become the span's children, so one click is one trace: browser -> nginx -> evilflowers.
 * - Session attributes (#58): theme, catalog, UI language, signed in, role. Bounded values only.
 * - Reader actions (#59): user actions, events and measurements, called only through ./analytics,
 *   the one layer for Umami and Faro.
 * - Errors (#60): render errors from RouteErrorBoundary, `ui.error_shown` from errorReference.
 * - Privacy: query strings are stripped from every URL before anything leaves the browser (search text
 *   lives there), console capture is off, free-text attributes are dropped, and the user id is set only
 *   outside production (IP-029 Q1). No names, e-mails, titles or search terms, ever.
 */
import { faro, getWebInstrumentations, initializeFaro, type TransportItem } from '@grafana/faro-web-sdk';
import { ReactIntegration } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { ROOT_CONTEXT, trace, type Context, type Span } from '@opentelemetry/api';
import { StackContextManager } from '@opentelemetry/sdk-trace-web';
import i18next from 'i18next';
import { config } from './config';

const FARO_URL = config.ELVIRA_FARO_URL;
const FARO_API_KEY = config.ELVIRA_FARO_API_KEY;
// The image build (mode `image`) serves real deployments: without an explicit value it is production, so the
// dev-only identity rules (user id, faro_session) stay off unless config.json says `development`.
const ENVIRONMENT =
  config.ELVIRA_FARO_ENVIRONMENT || (import.meta.env.MODE === 'image' ? 'production' : import.meta.env.MODE);
const SAMPLE_RATE = Number(config.ELVIRA_FARO_SAMPLE_RATE || 1);

/** API calls a screen starts this long after navigation are grouped under its route span. */
const ROUTE_GROUP_MS = 3000;
/** The route span ends once its requests have been quiet this long (capped by ROUTE_MAX_MS). */
const ROUTE_QUIET_MS = 1000;
const ROUTE_MAX_MS = 30_000;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const originOf = (url: string | undefined) => {
  try {
    return url ? new URL(url, window.location.origin).origin : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Collapses ids in a path so span and view names stay low-cardinality (Tempo span metrics, Loki):
 * `/entries/932beb16-…` -> `/entries/:id`. The portal's own route segments are lowercase words and
 * dashes, so any segment with a digit, a percent escape or an unusual character is a parameter
 * (UUIDs, numeric ids, `/cite/:entryId/:key` locator keys).
 */
export const routePattern = (pathname: string): string =>
  pathname
    .split('/')
    .map((seg) => (seg && seg !== '404' && !/^[a-z][a-z-]{0,39}$/.test(seg) ? ':id' : seg))
    .join('/') || '/';

// --- Privacy -----------------------------------------------------------------------------------

const URL_WITH_QUERY = /^((?:https?:\/\/|\/)[^\s?#]*)[?#]\S*$/;

/**
 * Returns a copy of a transport item in which any string that is a URL keeps only origin + path.
 * A copy, not in place: Faro freezes parts of its items (span attribute arrays).
 */
const scrubUrls = (value: unknown, depth = 0): unknown => {
  if (depth > 12 || value == null) return value;
  if (typeof value === 'string') {
    const m = URL_WITH_QUERY.exec(value);
    return m ? m[1] : value;
  }
  if (Array.isArray(value)) return value.map((v) => scrubUrls(v, depth + 1));
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) out[key] = scrubUrls(v, depth + 1);
    return out;
  }
  return value; // class instances (e.g. a preserved Error) pass through untouched
};

/** Exceptions thrown inside browser extensions are not the portal's. */
const EXTENSION_FRAME = /^(chrome|moz|safari-web)-extension:\/\//;
const isExtensionError = (item: TransportItem): boolean => {
  if (item.type !== 'exception') return false;
  const frames = (item.payload as { stacktrace?: { frames?: { filename?: string }[] } }).stacktrace?.frames ?? [];
  return frames.some((f) => EXTENSION_FRAME.test(f.filename ?? ''));
};

/** Attribute keys that hold free text (search terms, titles, names, chat). Never sent. */
const FREE_TEXT_KEY = /^(q|query|search|title|author|text|message|prompt|name|surname|username|email|label)$/i;
/** Longer values are not bounded ids or buckets. */
const MAX_VALUE_LENGTH = 64;

const snakeCase = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();

/**
 * Faro attributes from an analytics payload: string values, snake_case ASCII keys (they reach Loki as
 * `event_data_<key>`), free-text keys and over-long values dropped.
 */
export const safeAttributes = (data?: object): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!data) return out;
  for (const [key, raw] of Object.entries(data)) {
    if (raw === undefined || raw === null || FREE_TEXT_KEY.test(key)) continue;
    const value = Array.isArray(raw) ? raw.join(',') : typeof raw === 'object' ? undefined : String(raw);
    if (value === undefined || value.length > MAX_VALUE_LENGTH) continue;
    out[snakeCase(key)] = value;
  }
  return out;
};

// --- Route spans and views ---------------------------------------------------------------------

/**
 * The browser has no async context propagation without zone.js, so a span started on navigation
 * would not be the parent of the XHRs a screen fires later from effects. This context manager
 * falls back to the current route's context whenever nothing else is active, which is exactly
 * the moment the fetch/XHR instrumentation asks for a parent.
 */
class RouteContextManager extends StackContextManager {
  route: Context | undefined;

  active(): Context {
    const current = super.active();
    return current === ROOT_CONTEXT && this.route ? this.route : current;
  }
}

const contextManager = new RouteContextManager();

let routeSpan: Span | undefined;
let groupTimer: ReturnType<typeof setTimeout> | undefined;
let quietTimer: ReturnType<typeof setInterval> | undefined;
let lastChildEnd: number | undefined;
let routeStarted = 0;
/** The trace of the current screen; outlives the route span, so an error screen can quote it. */
let routeTraceId: string | undefined;

const endRoute = () => {
  clearTimeout(groupTimer);
  clearInterval(quietTimer);
  contextManager.route = undefined;
  if (routeSpan) routeSpan.end(lastChildEnd);
  routeSpan = undefined;
  lastChildEnd = undefined;
};

/** Called from the fetch/XHR end hooks: remember when the route's last request finished. */
const noteRequestEnd = (span: unknown) => {
  if (!routeSpan) return;
  const parent = (span as { parentSpanContext?: { spanId?: string } }).parentSpanContext;
  if (parent?.spanId === routeSpan.spanContext().spanId) lastChildEnd = Date.now();
};

const startRoute = (pathname: string, kind: 'load' | 'push' | 'replace' | 'pop', startTime?: number) => {
  endRoute();
  const route = routePattern(pathname);
  // Every later record of this screen (vitals, resources, HTTP events, user actions) carries it (#58).
  faro.api.setView({ name: route });
  routeSpan = trace.getTracer('elvira-portal').startSpan(
    `route ${route}`,
    { startTime, attributes: { 'app.route': route, 'app.navigation.type': kind } },
    ROOT_CONTEXT
  );
  routeTraceId = routeSpan.spanContext().traceId;
  contextManager.route = trace.setSpan(ROOT_CONTEXT, routeSpan);
  routeStarted = Date.now();

  // Stop adopting new requests after the grouping window, then end once requests went quiet.
  groupTimer = setTimeout(() => {
    contextManager.route = undefined;
    quietTimer = setInterval(() => {
      const now = Date.now();
      const quietSince = lastChildEnd ?? routeStarted;
      if (now - quietSince >= ROUTE_QUIET_MS || now - routeStarted >= ROUTE_MAX_MS) endRoute();
    }, 250);
  }, ROUTE_GROUP_MS);
};

/** history.pushState/replaceState run before React renders the next screen, so its calls join. */
const watchNavigation = () => {
  let lastPath = window.location.pathname;
  const onChange = (kind: 'push' | 'replace' | 'pop') => {
    const path = window.location.pathname;
    if (path === lastPath) return; // query-only changes (filters, search) stay on the same route
    lastPath = path;
    startRoute(path, kind);
  };
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method].bind(history);
    history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args);
      onChange(method === 'pushState' ? 'push' : 'replace');
    };
  }
  window.addEventListener('popstate', () => onChange('pop'));
};

// --- Session attributes ------------------------------------------------------------------------

/**
 * Merges bounded attributes into the current session. Same session id, so Faro keeps the session
 * (and `isSampled`, `previousSession`); attributes survive `resetUser()` and carry over to the next
 * session, unlike user attributes.
 */
const setSessionAttributes = (patch: Record<string, string>) => {
  const session = faro.api.getSession();
  const current = session?.attributes ?? {};
  if (Object.entries(patch).every(([key, value]) => current[key] === value)) return;
  faro.api.setSession({ ...session, attributes: { ...current, ...patch } });
};

// --- Init --------------------------------------------------------------------------------------

/**
 * The UI language: the reader's stored choice (cookie, which AppProvider applies after the first render
 * and updates before switching), else i18next's. i18next's own init briefly reports its default `sk`.
 */
const uiLanguage = (fallback?: string): string =>
  /(?:^|;\s*)elvira-lang=(sk|en)\b/.exec(document.cookie)?.[1] ?? (fallback || i18next.language || 'sk');

/** The deployment and UI context every record carries (#58): bounded values only. */
const sessionContext = (): Record<string, string> => ({
  theme: config.ELVIRA_THEME === 'ku' ? 'ku' : 'stu',
  catalog: config.ELVIRA_CATALOG_ID || 'none',
  lang: uiLanguage(),
});

let enabled = false;

const initTelemetry = () => {
  if (!FARO_URL || typeof window === 'undefined') return;
  // The receiver answers 401 to a keyless POST (x-api-key); sending would only collect errors.
  if (!FARO_API_KEY) {
    console.warn('[telemetry] ELVIRA_FARO_URL is set without ELVIRA_FARO_API_KEY; Faro stays off.');
    return;
  }

  const apiOrigin = originOf(config.ELVIRA_BASE_URL);
  const umamiOrigin = originOf(config.ELVIRA_UMAMI_SERVER);

  initializeFaro({
    url: FARO_URL,
    // Sent as x-api-key. Not a secret (it ships in the bundle or config.json); the receiver's CORS origin
    // list and the nginx/Alloy rate limits are what protect it (Observability-Stack §11).
    apiKey: FARO_API_KEY,
    // `release` identifies the build (short commit) for source maps per release (#58, knowledge#85).
    app: { name: 'elvira-portal', version: __APP_VERSION__, release: __GIT_SHA__, environment: ENVIRONMENT },
    view: { name: routePattern(window.location.pathname) },
    sessionTracking: {
      samplingRate: SAMPLE_RATE,
      session: { attributes: { ...sessionContext(), signed_in: 'false' } },
    },
    // LCP resource and INP script attribution: is a slow LCP the cover thumbnail or a script? (#58)
    webVitalsInstrumentation: { trackAttributionSources: true },
    // Analytics beacons are not part of the reader's request path.
    ignoreUrls: umamiOrigin ? [new RegExp(`^${escapeRegExp(umamiOrigin)}/`)] : [],
    // Known benign noise (#60): layout observer warnings and requests aborted by navigation or logout.
    ignoreErrors: [/ResizeObserver loop/, /AbortError/, /The user aborted a request/, /signal is aborted/, /^canceled$/],
    instrumentations: [
      // Errors, web vitals, sessions, views, user actions. Console capture off: it would ship reader data.
      ...getWebInstrumentations({ captureConsole: false }),
      new TracingInstrumentation({
        contextManager,
        instrumentationOptions: {
          // traceparent ONLY to the catalog API. Never to third-party origins.
          propagateTraceHeaderCorsUrls: apiOrigin ? [new RegExp(`^${escapeRegExp(apiOrigin)}/`)] : [],
          fetchInstrumentationOptions: { applyCustomAttributesOnSpan: (span) => noteRequestEnd(span) },
          xhrInstrumentationOptions: { applyCustomAttributesOnSpan: (span) => noteRequestEnd(span) },
        },
      }),
      // React metadata; no router options: views come from startRoute (#60).
      new ReactIntegration(),
    ],
    beforeSend: (item: TransportItem) => (isExtensionError(item) ? null : (scrubUrls(item) as TransportItem)),
  });

  enabled = true;
  // A resumed session (sessionStorage) brings back its old attributes, and Faro merges them over the
  // config's: after a deploy that changed the theme or catalog, the session would keep reporting the
  // old ones. Reapply the current values.
  setSessionAttributes(sessionContext());
  i18next.on('languageChanged', (lng) => setSessionAttributes({ lang: uiLanguage(lng) }));
  // The first route span starts at navigation start, so DNS/TLS/download/render wait is visible.
  startRoute(window.location.pathname, 'load', performance.timeOrigin);
  watchNavigation();
};

initTelemetry();

// --- Helpers for the rest of the portal (all no-ops when Faro is off) ---------------------------

/** Runs a Faro call only when Faro is on, and never lets telemetry break the portal. */
const guarded = (fn: () => void) => {
  if (!enabled) return;
  try {
    fn();
  } catch {
    // Telemetry must never throw into a reader's click.
  }
};

/**
 * Attaches the signed-in user's id to telemetry outside production (IP-029 Q1: dev may carry it,
 * matching EVILFLOWERS_TRACE_ENDUSER on the dev catalog). Never the username or e-mail.
 */
export const identifyTelemetryUser = (userId: string | undefined) => {
  // Opt-in by environment name, so a mislabelled build fails closed (no id), not open.
  if (ENVIRONMENT !== 'development') return;
  guarded(() => (userId ? faro.api.setUser({ id: userId }) : faro.api.resetUser()));
};

/** Signed in or not, and reader or admin: not personal data, so allowed everywhere (#58, IP-029 Q1). */
export const setTelemetryAuth = (signedIn: boolean, admin: boolean) =>
  guarded(() =>
    setSessionAttributes({ signed_in: String(signedIn), role: signedIn ? (admin ? 'admin' : 'reader') : 'anonymous' })
  );

/**
 * A named reader action (#59): Faro emits `faro.user.action` with its duration, and the HTTP calls
 * and errors it triggers carry its name. `data` goes through `safeAttributes`.
 */
export const trackUserAction = (name: string, data?: object) =>
  guarded(() => faro.api.startUserAction(name, safeAttributes(data), { triggerName: 'click' }));

/** A custom event with bounded attributes (reach Loki as `event_data_<key>`). */
export const trackEvent = (name: string, attributes: Record<string, string>) =>
  guarded(() => faro.api.pushEvent(name, attributes));

/** A timing in milliseconds; `context` reaches Loki as `context_<key>`. */
export const trackMeasurement = (type: string, values: Record<string, number>, context?: Record<string, string>) =>
  guarded(() => faro.api.pushMeasurement({ type, values }, context ? { context } : undefined));

/**
 * The Faro session id, the key that joins an Umami event with its Faro session and traces. Development
 * only: Umami identifies the user, so in production the join would make a Faro session attributable to a
 * person (IP-029 Q1, the same rule as the user id).
 */
export const currentSessionId = (): string | undefined => {
  if (!enabled || ENVIRONMENT !== 'development') return undefined;
  try {
    return faro.api.getSession()?.id;
  } catch {
    return undefined;
  }
};

/** The current screen's trace id (Faro on), for a "Ref …" on the error screen. */
export const currentTraceId = (): string | undefined => (enabled ? routeTraceId : undefined);

/**
 * A render error caught by RouteErrorBoundary (#60): one `kind=exception` with type `render`, the
 * original stack (for source maps) and the React component stack in its context.
 */
export const reportRenderError = (error: unknown, componentStack?: string | null) =>
  guarded(() => {
    const err = error instanceof Error ? error : new Error(String(error));
    faro.api.pushError(err, {
      type: 'render',
      context: componentStack ? { component_stack: componentStack.trim().slice(0, 2000) } : undefined,
    });
  });
