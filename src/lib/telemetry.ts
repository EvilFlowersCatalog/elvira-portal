/**
 * Browser tracing (elvira-portal#39, IP-029): Grafana Faro Web SDK with tracing.
 *
 * Imported for its side effect right after `forceHttps` in main.tsx, so fetch and XHR are
 * instrumented before any other module can capture them. A no-op when ELVIRA_FARO_URL is empty
 * (local dev, stu/prod until their receiver exists): nothing is patched or sent.
 *
 * - `traceparent` goes only to the catalog API origin (ELVIRA_BASE_URL), never to third parties.
 * - Each route change (and the initial page load) opens a `route <pattern>` span. API calls the
 *   screen starts within ROUTE_GROUP_MS become its children, so one click is one trace:
 *   browser -> nginx -> evilflowers. Later calls (a click on the same screen) start their own trace.
 * - Privacy: query strings are stripped from every URL before anything leaves the browser
 *   (search text lives there), console capture is off, and the user id is set only outside
 *   production (IP-029 Q1). No names or e-mails, ever.
 */
import { faro, getWebInstrumentations, initializeFaro, type TransportItem } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { ROOT_CONTEXT, trace, type Context, type Span } from '@opentelemetry/api';
import { StackContextManager } from '@opentelemetry/sdk-trace-web';

const FARO_URL = import.meta.env.ELVIRA_FARO_URL as string | undefined;
const ENVIRONMENT = (import.meta.env.ELVIRA_FARO_ENVIRONMENT as string | undefined) || import.meta.env.MODE;
const SAMPLE_RATE = Number(import.meta.env.ELVIRA_FARO_SAMPLE_RATE || 1);

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
 * Collapses ids in a path so span names stay low-cardinality (Tempo span metrics):
 * `/entries/932beb16-…` -> `/entries/:id`.
 */
export const routePattern = (pathname: string): string =>
  pathname
    .split('/')
    .map((seg) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) || /^\d+$/.test(seg)
        ? ':id'
        : seg
    )
    .join('/') || '/';

// --- Privacy: strip query strings / fragments from every URL-looking string ------------------

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

// --- Route spans --------------------------------------------------------------------------------

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
  routeSpan = trace.getTracer('elvira-portal').startSpan(
    `route ${route}`,
    { startTime, attributes: { 'app.route': route, 'app.navigation.type': kind } },
    ROOT_CONTEXT
  );
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

// --- Init ---------------------------------------------------------------------------------------

let enabled = false;

const initTelemetry = () => {
  if (!FARO_URL || typeof window === 'undefined') return;

  const apiOrigin = originOf(import.meta.env.ELVIRA_BASE_URL);
  const umamiOrigin = originOf(import.meta.env.ELVIRA_UMAMI_SERVER);

  initializeFaro({
    url: FARO_URL,
    apiKey: import.meta.env.ELVIRA_FARO_API_KEY,
    app: { name: 'elvira-portal', version: __APP_VERSION__, environment: ENVIRONMENT },
    sessionTracking: { samplingRate: SAMPLE_RATE },
    // Analytics beacons are not part of the reader's request path.
    ignoreUrls: umamiOrigin ? [new RegExp(`^${escapeRegExp(umamiOrigin)}/`)] : [],
    instrumentations: [
      // Errors, web vitals, sessions, views. Console capture off: it would ship reader data.
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
    ],
    beforeSend: (item: TransportItem) => scrubUrls(item) as TransportItem,
  });

  enabled = true;
  // The first route span starts at navigation start, so DNS/TLS/download/render wait is visible.
  startRoute(window.location.pathname, 'load', performance.timeOrigin);
  watchNavigation();
};

initTelemetry();

/**
 * Attaches the signed-in user's id to telemetry outside production (IP-029 Q1: dev may carry it,
 * matching EVILFLOWERS_TRACE_ENDUSER on the dev catalog). Never the username or e-mail.
 */
export const identifyTelemetryUser = (userId: string | undefined) => {
  // Opt-in by environment name, so a mislabelled build fails closed (no id), not open.
  if (!enabled || ENVIRONMENT !== 'development') return;
  if (userId) faro.api.setUser({ id: userId });
  else faro.api.resetUser();
};
