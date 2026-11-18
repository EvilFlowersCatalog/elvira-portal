import { useCallback, useEffect, useRef } from 'react';
import { useNavigationType, useSearchParams } from 'react-router-dom';
import { isReaderPanel } from '@/lib/links/paths';
import type { ViewerController } from '../pages/common/Viewer';

/**
 * Page changes that are a jump (EvilFlowersViewer docs/host-integration.md): they enter the viewer's own
 * history, so they get a browser history entry too and Back returns to where the reader jumped from.
 */
const JUMP_CAUSES = new Set(['link', 'outline', 'search', 'citation', 'host']);

/** Scrolling and stepping settle before the address follows: one history write, not one per page passed. */
const SETTLE_MS = 400;

/** How long replaying the opened address (search, label) may move pages without rewriting it. */
const REPLAY_MS = 2000;

/** How long opening at a passage may take before page changes count as the reader moving. */
const OPENING_MS = 5000;

type Patch = Record<string, string | null>;

export interface IReaderOpenedAt {
  /** The page the address opened at (`page`, or the passage's page for `loc`). */
  page: number | null;
  /** The page of the passage / figure the address pointed at (`loc`, `p`, `r`), if any. */
  focusPage: number | null;
  q: string | null;
  panel: string | null;
  label: string | null;
}

/**
 * Keeps the reader's address in step with the viewer, both ways (docs/semantic-urls.md):
 *
 * - viewer → URL: `page` (replaced while reading, pushed for jumps), `q` (the in-book search) and `panel`
 *   (the open Navigator section), from the viewer's `page-change`, `search` and `panel-change` events.
 *   Writes in one tick are merged into one history operation (React Router doesn't queue them).
 * - URL → viewer: on open, `label`, `q` and `panel` are applied once the document has loaded (`page` and the
 *   focus go in as `initialPage` / `initialFocus`); later, Back / Forward to another `page` moves the viewer.
 *
 * Nothing is remounted: the reader route doesn't revalidate on these params (routes/loaders.ts).
 */
export default function useReaderUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationType = useNavigationType();
  const setRef = useRef(setSearchParams);
  setRef.current = setSearchParams;

  const urlPage = Number(searchParams.get('page')) || null;
  // What the address says now, including writes not yet rendered (so an event never rewrites them twice).
  const writtenPage = useRef(urlPage);

  const viewerRef = useRef<ViewerController | null>(null);
  const queue = useRef<{ patch: Patch; push: boolean; scheduled: boolean }>({ patch: {}, push: false, scheduled: false });
  const settling = useRef<{ timer?: ReturnType<typeof setTimeout>; patch: Patch }>({ patch: {} });

  const flushQueue = useCallback(() => {
    const { patch, push } = queue.current;
    queue.current = { patch: {}, push: false, scheduled: false };
    if (!Object.keys(patch).length) return;
    setRef.current(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: !push, preventScrollReset: true },
    );
  }, []);

  /** Merge into this tick's write; one push in the tick makes the whole write a push. */
  const enqueue = useCallback(
    (patch: Patch, push: boolean) => {
      Object.assign(queue.current.patch, patch);
      queue.current.push ||= push;
      if (!queue.current.scheduled) {
        queue.current.scheduled = true;
        queueMicrotask(flushQueue);
      }
    },
    [flushQueue],
  );

  const write = useCallback(
    (patch: Patch, mode: 'push' | 'replace' | 'settle') => {
      if (mode === 'settle') {
        Object.assign(settling.current.patch, patch);
        clearTimeout(settling.current.timer);
        settling.current.timer = setTimeout(() => {
          const settled = settling.current.patch;
          settling.current = { patch: {} };
          enqueue(settled, false);
        }, SETTLE_MS);
        return;
      }
      // Whatever was settling belongs before this write.
      clearTimeout(settling.current.timer);
      const merged = { ...settling.current.patch, ...patch };
      settling.current = { patch: {} };
      enqueue(merged, mode === 'push');
    },
    [enqueue],
  );

  // URL → viewer, only for Back / Forward (POP): the reader's own writes never move it again.
  useEffect(() => {
    writtenPage.current = urlPage;
    if (navigationType !== 'POP') return;
    const viewer = viewerRef.current;
    if (!viewer?.goToPage || !urlPage) return;
    const current = viewer.getState().page;
    if (current && current !== urlPage) viewer.goToPage(urlPage);
  }, [urlPage, navigationType]);

  // Leaving the reader drops an unsettled write rather than rewriting the next page's address.
  useEffect(() => () => clearTimeout(settling.current.timer), []);

  /** Connect a mounted viewer; returns the disconnect. `opened` is the address the reader was opened with. */
  return useCallback(
    (viewer: ViewerController, opened: IReaderOpenedAt) => {
      viewerRef.current = viewer;
      if (!viewer.on) return () => {};
      let replayUntil = 0;
      let pointedAt = opened.focusPage;
      // Opening at a passage: the viewer reports the pages it passes on the way (scroll) before it settles on
      // the passage. Those are not the reader moving away, so nothing is written until it arrives.
      let arriving = pointedAt !== null;
      const arriveBy = Date.now() + OPENING_MS;

      const offs = [
        viewer.on<{ page: number; cause?: string }>('page-change', ({ page, cause }) => {
          if (!page) return;
          // Scrolling around the passage (its box brought into view puts the page above it at the top) is
          // still reading it: the address keeps pointing at the passage.
          if (pointedAt !== null && cause === 'scroll' && Math.abs(page - pointedAt) <= 1) return;
          if (arriving) {
            if (page !== pointedAt && Date.now() < arriveBy) return;
            arriving = false;
          }
          // Replaying the opened address (search, label) is not the reader moving: the address stays.
          if (Date.now() < replayUntil) return;
          if (page === writtenPage.current) return;
          // The first page of a link without one stays implicit.
          if (cause === 'initial' && page === 1 && !writtenPage.current) return;
          writtenPage.current = page;
          const patch: Patch = { page: String(page) };
          // Away from the passage / figure / label the link pointed at: the address is now this page, so a
          // refresh stays here instead of jumping back to the citation.
          if (pointedAt === null || page !== pointedAt) {
            Object.assign(patch, { loc: null, p: null, r: null, label: null });
            pointedAt = null;
          }
          write(patch, cause === 'initial' ? 'replace' : cause && JUMP_CAUSES.has(cause) ? 'push' : 'settle');
        }),
        viewer.on<{ query?: string }>('search', ({ query }) => write({ q: query?.trim() || null }, 'replace')),
        viewer.on<{ panel?: string | null }>('panel-change', ({ panel }) =>
          write({ panel: isReaderPanel(panel) ? panel : null }, 'replace'),
        ),
        viewer.on('document-loaded', async () => {
          if (!opened.label && !opened.q && !isReaderPanel(opened.panel)) return;
          replayUntil = Date.now() + REPLAY_MS;
          try {
            if (opened.label) {
              const labelled = await viewer.goToLabel?.(opened.label);
              if (labelled) pointedAt = labelled;
            }
            if (opened.q) {
              await viewer.search?.(opened.q, { openPanel: opened.panel === 'search' });
              // A search goes to its first match; the address's page wins (a refresh mid-results stays put).
              const stay = opened.label ? pointedAt : opened.page;
              if (stay && viewer.getState().page !== stay) viewer.goToPage?.(stay);
            } else if (isReaderPanel(opened.panel)) {
              viewer.openPanel?.(opened.panel);
            }
          } finally {
            replayUntil = Date.now() + SETTLE_MS;
          }
        }),
      ];

      return () => {
        offs.forEach((off) => off());
        if (viewerRef.current === viewer) viewerRef.current = null;
      };
    },
    [write],
  );
}
