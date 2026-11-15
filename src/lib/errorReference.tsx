/**
 * "Ref <trace id>" on error toasts (elvira-portal#39), so a reader can quote it in a support
 * report and support can open the exact trace in Tempo.
 *
 * The catalog answers every request, errors included, with
 * `Server-Timing: traceparent;desc="00-<trace>-<span>-01"` (exposed via CORS). The axios response
 * interceptor hands failed responses to `noteFailedRequest`; the next `toast.error` raised shortly
 * after shows that id. Done centrally because ~40 call sites raise error toasts, many from a bare
 * `catch {}` with no error object to read. Works with or without Faro enabled.
 */
import { toast } from 'react-toastify';

/** A toast raised this long after the failure is taken to be about it. */
const CORRELATION_MS = 5000;

let lastFailure: { traceId: string; at: number } | undefined;

/** Trace id from the catalog's `Server-Timing` response header, if present. */
export const traceIdOf = (headers: unknown): string | undefined => {
  const h = headers as { get?: (name: string) => unknown; [key: string]: unknown } | undefined;
  const value = typeof h?.get === 'function' ? h.get('server-timing') : h?.['server-timing'];
  const match = typeof value === 'string' ? /traceparent;desc="?00-([0-9a-f]{32})-/.exec(value) : null;
  return match?.[1];
};

/** Called by the axios response interceptor for every failed response. */
export const noteFailedRequest = (headers: unknown): string | undefined => {
  const traceId = traceIdOf(headers);
  if (traceId) lastFailure = { traceId, at: Date.now() };
  return traceId;
};

const takeRecentTraceId = (): string | undefined => {
  if (!lastFailure || Date.now() - lastFailure.at > CORRELATION_MS) return undefined;
  const { traceId } = lastFailure;
  lastFailure = undefined;
  return traceId;
};

const originalError = toast.error;

toast.error = ((content, options) => {
  const traceId = takeRecentTraceId();
  if (!traceId || typeof content === 'function') return originalError(content, options);
  return originalError(
    <>
      {content}
      <span className='mt-1 block select-all font-mono text-[11px] opacity-70'>Ref {traceId}</span>
    </>,
    // Long enough to read and copy; a click selects the id instead of dismissing the toast.
    { autoClose: 10_000, closeOnClick: false, ...options }
  );
}) as typeof toast.error;
