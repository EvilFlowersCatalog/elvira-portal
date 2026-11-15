import { useCallback, useEffect, useRef, useState } from 'react';
import { problemDetailMessage } from '../utils/problemDetail';

export interface BulkItem {
  id: string;
  label: string;
}

export interface BulkFailure extends BulkItem {
  message: string;
}

/** `skipped` = the item was not in a state the action applies to; nothing was sent. */
export type BulkOutcome = 'done' | 'skipped';

export interface BulkState {
  phase: 'idle' | 'collecting' | 'running' | 'finished';
  /** Key of the action that runs or ran (for the summary text). */
  action: string | null;
  total: number;
  done: number;
  skipped: number;
  failed: BulkFailure[];
  cancelled: boolean;
}

const IDLE: BulkState = { phase: 'idle', action: null, total: 0, done: 0, skipped: 0, failed: [], cancelled: false };

export interface BulkRun {
  action: string;
  /** The items, or a function that gathers them first (e.g. every row matching a filter). */
  items: BulkItem[] | ((signal: AbortSignal) => Promise<BulkItem[]>);
  task: (item: BulkItem, signal: AbortSignal) => Promise<BulkOutcome>;
  /** Message for a failure whose response carries none. */
  errorFallback: string;
  concurrency?: number;
  /** Once every item settled (or the run was cancelled) — invalidate caches here, once. */
  onFinish?: (state: BulkState) => void;
}

/**
 * Runs one request per item with bounded concurrency, counting what was done, skipped and why
 * something failed. Cancel stops dispatching (requests in flight are aborted); unmounting cancels.
 */
export default function useBulkRunner() {
  const [state, setState] = useState<BulkState>(IDLE);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = useCallback(async ({ action, items, task, errorFallback, concurrency = 4, onFinish }: BulkRun) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const { signal } = ctrl;

    let current: BulkState = { ...IDLE, action, phase: typeof items === 'function' ? 'collecting' : 'running' };
    const commit = (patch: Partial<BulkState>) => {
      current = { ...current, ...patch };
      if (!signal.aborted || patch.phase === 'finished') setState(current);
    };
    commit({});

    let list: BulkItem[];
    try {
      list = typeof items === 'function' ? await items(signal) : items;
    } catch (error) {
      if (!signal.aborted) {
        commit({ phase: 'finished', failed: [{ id: '', label: '', message: problemDetailMessage(error, errorFallback) }] });
        onFinish?.(current);
      }
      return;
    }
    if (signal.aborted) return;
    commit({ phase: 'running', total: list.length });

    let next = 0;
    const worker = async () => {
      while (!signal.aborted && next < list.length) {
        const item = list[next++];
        try {
          const outcome = await task(item, signal);
          if (signal.aborted) return;
          commit(outcome === 'done' ? { done: current.done + 1 } : { skipped: current.skipped + 1 });
        } catch (error) {
          if (signal.aborted) return;
          commit({ failed: [...current.failed, { ...item, message: problemDetailMessage(error, errorFallback) }] });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));

    if (controller.current !== ctrl) return; // A newer run replaced this one.
    commit({ phase: 'finished', cancelled: signal.aborted });
    onFinish?.(current);
  }, []);

  const cancel = useCallback(() => {
    if (!controller.current) return;
    controller.current.abort();
    setState((s) => (s.phase === 'idle' || s.phase === 'finished' ? s : { ...s, phase: 'finished', cancelled: true }));
  }, []);

  const reset = useCallback(() => setState(IDLE), []);

  return { state, run, cancel, reset, busy: state.phase === 'collecting' || state.phase === 'running' };
}
