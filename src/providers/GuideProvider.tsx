import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppContext from '../hooks/contexts/useAppContext';
import useAuthContext from '../hooks/contexts/useAuthContext';
import useEscapeLayer from '../hooks/useEscapeLayer';
import GuideSpotlight from '../components/guide/GuideSpotlight';
import {
  buildSteps,
  GuideAccess,
  GuideRequest,
  GuideStep,
  guideTarget,
  sanitizeGuide,
} from '../components/guide/guideRegistry';

/**
 * The assistant's hands in the portal: it takes the reader to a place and lights up what to look at there
 * ("show me"), or walks them through several places (a tour). One instance for the whole app, mounted in `App`.
 *
 * The guide is non-modal — the page stays usable under the dimmed overlay — and follows the reader: clicking
 * the highlighted menu entry moves on to the next step, navigating anywhere else ends the guide.
 */

export type GuidePhase = 'moving' | 'locating' | 'shown' | 'missing';

interface IGuideRun {
  id: number;
  steps: GuideStep[];
  index: number;
  /** Started from the assistant: the guide offers a way back to the chat. */
  fromChat: boolean;
}

export interface IGuideContext {
  active: boolean;
  access: GuideAccess;
  /** Lights up the request's places one after another. */
  start: (request: GuideRequest, options?: { fromChat?: boolean }) => boolean;
  /** "Just take me there": goes to the request's (last) page without the spotlight. */
  go: (request: GuideRequest) => boolean;
  stop: () => void;
}

export const GuideContext = createContext<IGuideContext | null>(null);

const LOCATE_TIMEOUT = 6000;

/** The first rendered, visible element with the anchor (an anchor may repeat, e.g. on every book card). */
const findAnchor = (anchor: string): HTMLElement | null => {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-guide="${CSS.escape(anchor)}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
};

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export default function GuideProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { auth } = useAuthContext();
  const { isSmallDevice, setShowNavbar, setShowAiAssistant, umamiTrack } = useAppContext();

  const access = useMemo<GuideAccess>(() => ({ authenticated: !!auth, admin: !!auth?.isSuperUser }), [auth]);

  const [run, setRun] = useState<IGuideRun | null>(null);
  const [phase, setPhase] = useState<GuidePhase>('moving');
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const runIds = useRef(0);
  /** The page the guide itself is taking the reader to, so arriving there isn't read as leaving. */
  const navigatingTo = useRef<string | null>(null);
  /** Where a step without a page of its own (the sidebar) was shown. */
  const shownAt = useRef<string | null>(null);
  const openedMenu = useRef(false);

  const step = run ? run.steps[run.index] : null;

  const closeMenu = useCallback(() => {
    if (openedMenu.current) {
      openedMenu.current = false;
      setShowNavbar(false);
    }
  }, [setShowNavbar]);

  const stop = useCallback(() => {
    setRun(null);
    setElement(null);
    navigatingTo.current = null;
    shownAt.current = null;
    closeMenu();
  }, [closeMenu]);

  const moveTo = useCallback((index: number) => {
    setRun((current) => (current && index >= 0 && index < current.steps.length ? { ...current, index } : current));
  }, []);

  const start = useCallback<IGuideContext['start']>(
    (request, options = {}) => {
      const clean = sanitizeGuide(request, access);
      if (!clean) return false;
      const steps = buildSteps(clean, access, pathname, t);
      if (!steps.length) return false;
      umamiTrack('Assistant Guide', { tour: clean.tour, targets: clean.targets.join(',') });
      // The drawer would cover what the guide points at; the chat stays as it is and the guide offers a way back.
      setShowAiAssistant(false);
      navigatingTo.current = null;
      shownAt.current = null;
      setRun({ id: ++runIds.current, steps, index: 0, fromChat: !!options.fromChat });
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [access, pathname, t],
  );

  const go = useCallback<IGuideContext['go']>(
    (request) => {
      const clean = sanitizeGuide(request, access);
      const last = clean?.targets.map((id) => guideTarget(id, access)).filter((target) => target?.path).pop();
      if (!last?.path) return start(request, { fromChat: true });
      stop();
      setShowAiAssistant(false);
      navigate(last.path);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [access, start, stop],
  );

  // Bring the step's page up, then find its anchor (routes are lazy, lists load after the page).
  useEffect(() => {
    if (!run || !step) return;
    setElement(null);

    if (step.path && pathname !== step.path) {
      if (navigatingTo.current !== step.path) {
        setPhase('moving');
        navigatingTo.current = step.path;
        navigate(step.path);
      }
      return;
    }
    navigatingTo.current = null;

    // On a small screen the sidebar is a drawer: keep it shut unless the step is in it.
    if (isSmallDevice && !step.menu) closeMenu();

    setPhase('locating');
    const deadline = Date.now() + LOCATE_TIMEOUT;
    let timer = 0;
    let first = true;
    const look = () => {
      // Opened here, not in the effect body: AppProvider shuts the sidebar on every page change, and its effect
      // runs after this one.
      if (first && isSmallDevice && step.menu) {
        openedMenu.current = true;
        setShowNavbar(true);
      }
      first = false;
      const found = findAnchor(step.anchor);
      if (found) {
        found.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
        shownAt.current = pathname;
        setElement(found);
        setPhase('shown');
      } else if (Date.now() > deadline) {
        shownAt.current = pathname;
        setPhase('missing');
      } else {
        timer = window.setTimeout(look, 120);
      }
    };
    // One frame for the drawer / sidebar to render first.
    timer = window.setTimeout(look, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, run?.index, pathname, attempt]);

  // The reader navigated on their own: into the next step's page (they clicked what we pointed at) moves on,
  // anywhere else ends the guide.
  useEffect(() => {
    if (!run || !step) return;
    const home = step.path ?? shownAt.current;
    if (!home || pathname === home || pathname === navigatingTo.current) return;
    const next = run.steps[run.index + 1];
    if (next && (!next.path || next.path === pathname)) moveTo(run.index + 1);
    else stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // On the last step, using the highlighted control hands the page back to the reader.
  useEffect(() => {
    if (!run || !element || run.index !== run.steps.length - 1) return;
    const onClick = () => window.setTimeout(stop, 0);
    element.addEventListener('click', onClick);
    return () => element.removeEventListener('click', onClick);
  }, [run, element, stop]);

  useEscapeLayer(stop, !!run);

  // ← / → step through, unless the reader is typing.
  useEffect(() => {
    if (!run) return;
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]');
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (run.index < run.steps.length - 1) moveTo(run.index + 1);
        else stop();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveTo(run.index - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, moveTo, stop]);

  const value = useMemo<IGuideContext>(() => ({ active: !!run, access, start, go, stop }), [run, access, start, go, stop]);

  return (
    <GuideContext.Provider value={value}>
      {children}
      {run && step ? (
        <GuideSpotlight
          key={run.id}
          step={step}
          index={run.index}
          total={run.steps.length}
          phase={phase}
          element={element}
          onNext={() => (run.index < run.steps.length - 1 ? moveTo(run.index + 1) : stop())}
          onPrev={() => moveTo(run.index - 1)}
          onClose={stop}
          onRetry={() => setAttempt((n) => n + 1)}
          onBackToChat={
            run.fromChat
              ? () => {
                  stop();
                  setShowAiAssistant(true);
                }
              : undefined
          }
        />
      ) : null}
    </GuideContext.Provider>
  );
}
