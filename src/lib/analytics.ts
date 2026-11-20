/**
 * One analytics layer for the whole portal: Umami (product analytics) and Grafana Faro (LGTM stack,
 * joined with traces and web vitals). Components call only this module, never `window.umami` or
 * `faro.api` (#59).
 *
 * | call            | Umami                       | Faro                                          |
 * |-----------------|-----------------------------|-----------------------------------------------|
 * | `track`         | event + labels              | `faro.user.action` (safe attributes only)     |
 * | `trackOutcome`  | event + labels              | event (`event_data_<key>`)                    |
 * | `measure`       | —                           | measurement (`context_<key>`): assistant, viewer |
 * | `identify`      | identify (id + data)        | signed_in / role; user id on dev only         |
 * | global capture  | errors, API failures, vitals | (Faro captures errors and vitals itself)      |
 *
 * **Labels.** Every Umami event carries `view` (the route pattern, as Faro's `view_name`) and, on
 * development with Faro on, `faro_session` (Faro's `session_id`): the join key from an Umami event to the
 * Faro session, its user actions, errors and traces in Grafana. Not in production: Umami identifies the
 * user, so the join would attach a person to a Faro session (IP-029 Q1). Faro records carry the same view
 * and session natively, plus `app_release`.
 *
 * **Names.** Reader actions keep their established Umami names (`PDF Read Button`, …), so Umami's
 * history stays continuous. Outcomes and diagnostics use `domain.result` names from `EVENTS`.
 *
 * Either backend may be off (no ELVIRA_UMAMI_* / no ELVIRA_FARO_URL); every call is then a no-op for
 * it. Privacy (IP-029): bounded values only. `safeAttributes` drops free-text keys (search terms,
 * titles, names) for both backends' outcome events and for Faro actions; `{ faro: false }` keeps an
 * event in Umami alone (the URL-parameter events, which carry search text by design).
 */
import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { config } from './config';
import {
  currentSessionId,
  identifyTelemetryUser,
  routePattern,
  safeAttributes,
  setTelemetryAuth,
  telemetryEnabled,
  trackEvent,
  trackMeasurement,
  trackUserAction,
} from './telemetry';

/** Outcome and diagnostic events: the same name in Umami and Faro (`event_name` in Loki). */
export const EVENTS = {
  /** A borrow / reserve / claim / return ended: `op`, `result` (ok | queued | error), `status`. */
  loanResult: 'loan.result',
  /** A search's result count as a bucket: `results` (0 | 1-10 | >10). */
  searchResult: 'search.result',
  /** An error toast was shown: `trace_id`, `status`. */
  errorShown: 'ui.error_shown',
  /** The error screen replaced a page: `kind` (render | chunk), `trace_id`. */
  renderError: 'ui.render_error',
  /** A data request failed: `source` (query | mutation), `resource`, `status`. */
  apiError: 'api.error',
  /** An uncaught error or rejection (Umami only; Faro has the exception itself): `kind`. */
  jsError: 'js.error',
  /** The viewer failed to show a document before its first page: `stage` (download | parse | render). */
  viewerError: 'viewer.error',
  /** A Core Web Vital, rated (Umami only; Faro has the values): `metric`, `rating`. */
  webVital: 'perf.web_vital',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

interface Umami {
  track: (name: string, data?: object) => void;
  // @types/umami has no `identify` yet.
  identify?: (id: string, data?: Record<string, unknown>) => void;
}

const umami = () => (typeof window === 'undefined' ? undefined : (window as unknown as { umami?: Umami }).umami);
const umamiOn = !!config.ELVIRA_UMAMI_SERVER && !!config.ELVIRA_UMAMI_WEBSITE;

/** Labels every Umami event carries, so it can be joined with Faro. */
const labels = (): Record<string, string> => {
  const session = currentSessionId();
  return {
    view: routePattern(window.location.pathname),
    ...(session ? { faro_session: session } : {}),
  };
};

const sendUmami = (name: string, data?: object) => {
  try {
    umami()?.track(name, { ...(data ?? {}), ...labels() });
  } catch {
    // Analytics must never throw into a reader's click.
  }
};

// --- Calls -------------------------------------------------------------------------------------

/**
 * A named reader action: a click, a submit. Umami gets `data` with the labels; Faro gets a user action
 * with its HTTP calls attached and only the safe attributes. `faro: false` keeps it in Umami alone.
 */
export const track = (name: string, data?: object, options?: { faro?: boolean }) => {
  sendUmami(name, data);
  if (options?.faro !== false) trackUserAction(name, data);
};

/**
 * How something ended or went wrong: bounded string attributes, sent to both backends under the same
 * name. `umamiOnly` for what Faro already records on its own (exceptions, web vitals).
 */
export const trackOutcome = (name: AnalyticsEvent, attributes: Record<string, string>, options?: { umamiOnly?: boolean }) => {
  const safe = safeAttributes(attributes);
  sendUmami(name, safe);
  if (!options?.umamiOnly) trackEvent(name, safe);
};

/** A timing in milliseconds (Faro only: Umami has no numeric series). */
export const measure = trackMeasurement;

// --- Outcomes and timings (#59) ----------------------------------------------------------------

/** The HTTP status of a failed request, `none` for anything else (network error, validation). */
export const statusOf = (error: unknown): string => {
  const e = error as { response?: { status?: unknown }; status?: unknown } | undefined;
  const status = e?.response?.status ?? e?.status;
  return typeof status === 'number' ? String(status) : 'none';
};

export type LoanOp = 'borrow' | 'reserve' | 'claim' | 'return';

/**
 * Runs a loan call and reports how it ended: `loan.result` with `op`, `result`
 * (`ok` | `queued` | `error`) and `status`. Rethrows, so callers handle errors as before.
 */
export const withLoanResult = async <T>(op: LoanOp, run: () => Promise<T>, okResult: 'ok' | 'queued' = 'ok'): Promise<T> => {
  try {
    const value = await run();
    trackOutcome(EVENTS.loanResult, { op, result: okResult, status: 'none' });
    return value;
  } catch (error) {
    trackOutcome(EVENTS.loanResult, { op, result: 'error', status: statusOf(error) });
    throw error;
  }
};

/** How many results a search returned, as a bucket; never the query. */
export const trackSearchResult = (count: number) =>
  trackOutcome(EVENTS.searchResult, { results: count === 0 ? '0' : count <= 10 ? '1-10' : '>10' });

/**
 * Times one assistant answer: `first_token_ms` once the first streamed text arrives (chat only),
 * `total_ms` when `end` is called. Reports once.
 */
export const startAssistantTimer = (kind: 'chat' | 'explain') => {
  const started = performance.now();
  let firstToken: number | undefined;
  let ended = false;
  return {
    firstToken: () => {
      if (firstToken === undefined) firstToken = performance.now() - started;
    },
    end: (outcome: 'ok' | 'error') => {
      if (ended) return;
      ended = true;
      const values: Record<string, number> = { total_ms: Math.round(performance.now() - started) };
      if (firstToken !== undefined) values.first_token_ms = Math.round(firstToken);
      measure('assistant', values, { kind, outcome });
    },
  };
};

/** One event of the viewer's telemetry (EvilFlowersViewer docs/telemetry.md, `ITelemetryEvent`). */
interface IViewerTelemetryEvent {
  name: string;
  time: number;
  durationMs?: number;
  level: 'info' | 'warn' | 'error';
  sessionId: string;
  documentSeq: number;
  attributes: Record<string, string | number | boolean | null>;
}

/**
 * The viewer's telemetry sink (`options.telemetry`, elvira-portal#64), or null with Faro off, so the viewer
 * records nothing. Timed events become measurements (`viewer.<name>`, `duration_ms`), the rest events; the
 * attributes reach Loki as `context_<key>` / `event_data_<key>`. The viewer sends no document content and
 * bounded values only; `safeAttributes` still applies, as for every Faro record.
 *
 * `longFrames` stays on: Faro's web vitals give INP per interaction, not main-thread stalls while reading.
 */
export const viewerTelemetrySink = () => {
  if (!telemetryEnabled()) return null;
  return {
    export: (batch: readonly IViewerTelemetryEvent[]) => {
      for (const event of batch) {
        const context = safeAttributes({
          ...event.attributes,
          level: event.level,
          documentSeq: event.documentSeq,
          viewerSession: event.sessionId,
        });
        // `viewer.mount` / `viewer.unmount` already carry the prefix.
        const name = event.name.startsWith('viewer.') ? event.name : `viewer.${event.name}`;
        if (event.durationMs !== undefined) trackMeasurement(name, { duration_ms: Math.round(event.durationMs) }, context);
        else trackEvent(name, context);
      }
    },
  };
};

/**
 * A failed query or mutation, from React Query's global caches (lib/reactQuery). `resource` is the
 * first element of the query key (a fixed name such as `entries-infinite`), never its parameters.
 */
export const trackApiError = (source: 'query' | 'mutation', key: readonly unknown[] | undefined, error: unknown) => {
  const status = statusOf(error);
  // 401 logs the reader out (useAxios) and a cancelled request is not a failure.
  if (status === '401' || (error as { name?: string } | undefined)?.name === 'CanceledError') return;
  const head = key?.[0];
  trackOutcome(EVENTS.apiError, { source, resource: typeof head === 'string' ? head : 'unknown', status });
};

/** The error screen replaced a page (RouteErrorBoundary). */
export const trackRenderError = (kind: 'render' | 'chunk', traceId?: string) =>
  trackOutcome(EVENTS.renderError, { kind, trace_id: traceId ?? 'none' });

// --- Identity ----------------------------------------------------------------------------------

/**
 * The signed-in user, on login and on a restored session; `undefined` on logout. Umami gets the id
 * (retrying while its script loads); Faro gets signed_in / role everywhere and the id on dev only.
 * Returns a cleanup function for the effect that calls it.
 */
export const identify = (user: { id: string; username?: string; isSuperUser?: boolean } | undefined): (() => void) => {
  setTelemetryAuth(!!user, !!user?.isSuperUser);
  identifyTelemetryUser(user?.id);
  if (!user || !umamiOn) return () => {};

  const data = { username: user.username, isSuperUser: user.isSuperUser, ...labels() };
  const tryIdentify = () => {
    const tracker = umami();
    if (!tracker?.identify) return false;
    tracker.identify(user.id, data);
    return true;
  };
  if (tryIdentify()) return () => {};

  // The tracker script loads deferred, so retry for a few seconds.
  let attempts = 0;
  const interval = setInterval(() => {
    attempts += 1;
    if (tryIdentify() || attempts >= 20) clearInterval(interval);
  }, 500);
  return () => clearInterval(interval);
};

// --- Setup: the Umami tracker and global capture -----------------------------------------------

/** Loads the Umami tracker once, when the deployment configures it. */
const loadUmami = () => {
  if (!umamiOn || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = `${config.ELVIRA_UMAMI_SERVER}/script.js`;
  script.setAttribute('data-website-id', config.ELVIRA_UMAMI_WEBSITE);
  document.head.appendChild(script);
};

/** At most this many uncaught errors per page load reach Umami (an error loop must not flood it). */
const MAX_JS_ERRORS = 5;

/**
 * Uncaught errors and rejections, and rated Core Web Vitals, into Umami. Faro records both on its own
 * (exceptions with stacks, vitals with values and attribution), so these go to Umami only: a count by
 * screen next to the product events, never the error message.
 */
const captureGlobally = () => {
  if (!umamiOn || typeof window === 'undefined') return;

  let jsErrors = 0;
  const onError = (kind: 'error' | 'rejection') => {
    if (jsErrors >= MAX_JS_ERRORS) return;
    jsErrors += 1;
    trackOutcome(EVENTS.jsError, { kind }, { umamiOnly: true });
  };
  window.addEventListener('error', (event) => {
    // Failed resource loads (an image) bubble here without an error object; not a script error.
    if (event.error || event.message) onError('error');
  });
  window.addEventListener('unhandledrejection', (event) => {
    if ((event.reason as { name?: string } | undefined)?.name === 'CanceledError') return;
    onError('rejection');
  });

  const report = (metric: Metric) =>
    trackOutcome(EVENTS.webVital, { metric: metric.name, rating: metric.rating }, { umamiOnly: true });
  onLCP(report);
  onINP(report);
  onCLS(report);
  onTTFB(report);
};

loadUmami();
captureGlobally();
