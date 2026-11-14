import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiArrowRight, FiCheck, FiMessageCircle, FiRefreshCw, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import type { GuidePhase } from '../../providers/GuideProvider';
import type { GuideStep } from './guideRegistry';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const GAP = 14;
const EDGE = 12;
const WIDTH = 340;
const Z = 1300;

const sameBox = (a: Box | null, b: Box | null) =>
  !!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

/** The element's box, followed every frame: the page scrolls, the sidebar expands, lists load around it. */
const useTrackedBox = (element: HTMLElement | null): Box | null => {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    if (!element) {
      setBox(null);
      return;
    }
    let frame = 0;
    let last: Box | null = null;
    const read = () => {
      if (!element.isConnected) {
        setBox(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      // Padded, but kept inside the viewport so a full-width target keeps its ring on screen.
      const left = Math.max(rect.left - PAD, 4);
      const top = Math.max(rect.top - PAD, 4);
      const right = Math.min(rect.right + PAD, window.innerWidth - 4);
      const bottom = Math.min(rect.bottom + PAD, window.innerHeight - 4);
      const next = { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
      if (!sameBox(last, next)) {
        last = next;
        setBox(next);
      }
      frame = requestAnimationFrame(read);
    };
    read();
    return () => cancelAnimationFrame(frame);
  }, [element]);
  return box;
};

type Placement = 'right' | 'left' | 'bottom' | 'top' | 'center' | 'dock';

/** Where the card goes: beside a sidebar entry, under or over anything wide, docked at the bottom on a phone. */
const place = (box: Box | null, card: { width: number; height: number }) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

  if (vw < 600) {
    const low = !box || box.top + box.height / 2 < vh * 0.55;
    return { placement: 'dock' as Placement, style: low ? { left: EDGE, right: EDGE, bottom: EDGE } : { left: EDGE, right: EDGE, top: EDGE } };
  }
  if (!box) {
    return { placement: 'center' as Placement, style: { left: (vw - card.width) / 2, top: clamp(vh * 0.32, EDGE, vh - card.height - EDGE) } };
  }

  const room = {
    right: vw - (box.left + box.width),
    left: box.left,
    bottom: vh - (box.top + box.height),
    top: box.top,
  };
  const fitsSide = (space: number) => space >= card.width + GAP + EDGE;
  const fitsEnd = (space: number) => space >= card.height + GAP + EDGE;
  const midY = clamp(box.top + box.height / 2 - card.height / 2, EDGE, vh - card.height - EDGE);
  const midX = clamp(box.left + box.width / 2 - card.width / 2, EDGE, vw - card.width - EDGE);

  // A tall or narrow target (a sidebar entry) reads best with the card beside it.
  if (box.width < vw * 0.4 && fitsSide(room.right)) return { placement: 'right' as Placement, style: { left: box.left + box.width + GAP, top: midY } };
  if (fitsEnd(room.bottom)) return { placement: 'bottom' as Placement, style: { left: midX, top: box.top + box.height + GAP } };
  if (fitsEnd(room.top)) return { placement: 'top' as Placement, style: { left: midX, top: box.top - GAP - card.height } };
  if (fitsSide(room.right)) return { placement: 'right' as Placement, style: { left: box.left + box.width + GAP, top: midY } };
  if (fitsSide(room.left)) return { placement: 'left' as Placement, style: { left: box.left - GAP - card.width, top: midY } };
  // The target fills the screen: float the card inside it, at the bottom.
  return { placement: 'center' as Placement, style: { left: midX, top: vh - card.height - EDGE * 2 } };
};

export default function GuideSpotlight({
  step,
  index,
  total,
  phase,
  element,
  onNext,
  onPrev,
  onClose,
  onRetry,
  onBackToChat,
}: {
  step: GuideStep;
  index: number;
  total: number;
  phase: GuidePhase;
  element: HTMLElement | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onRetry: () => void;
  onBackToChat?: () => void;
}) {
  const { t } = useTranslation();
  const box = useTrackedBox(phase === 'shown' ? element : null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [cardSize, setCardSize] = useState({ width: WIDTH, height: 180 });
  const [, setViewport] = useState(0);

  const last = index === total - 1;
  const busy = phase === 'moving' || phase === 'locating';
  const missing = phase === 'missing';

  // The card's real size places it; it changes with each step's text.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () =>
      setCardSize((size) =>
        size.width === card.offsetWidth && size.height === card.offsetHeight ? size : { width: card.offsetWidth, height: card.offsetHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setViewport((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard users land on the card's main action with each step.
  useEffect(() => {
    if (phase === 'shown' || phase === 'missing') nextRef.current?.focus({ preventScroll: true });
  }, [phase, index]);

  const { placement, style } = place(box, cardSize);
  const titleId = `guide-title-${step.key}`;

  return createPortal(
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: Z }} data-guide-overlay>
      {/* The dim with a hole: a box-shadow around the target, so the hole glides from step to step. */}
      {box ? (
        <>
          <div
            aria-hidden="true"
            className="absolute rounded-xl transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={{ ...box, boxShadow: '0 0 0 9999px rgba(9, 9, 11, 0.55)' }}
          />
          <div
            aria-hidden="true"
            className="absolute rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={box}
          >
            <span className="absolute inset-0 rounded-xl ring-2 ring-primary animate-guide-pulse motion-reduce:hidden" />
          </div>
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-zinc-950/40 transition-opacity duration-300 animate-fade-in" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-live="polite"
        data-placement={placement}
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl ring-1 ring-black/5 transition-[top,left,right,bottom] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10"
        style={{ ...style, width: placement === 'dock' ? undefined : WIDTH }}
      >
        {/* Progress */}
        {total > 1 ? (
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800" aria-hidden="true">
            <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
        ) : (
          <div className="h-1 w-full bg-primary" aria-hidden="true" />
        )}

        <div key={step.key + phase} className="flex flex-col gap-2 p-4 animate-guide-in motion-reduce:animate-none">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight">
              <HiSparkles size={13} aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('guide.label')}
              {total > 1 ? <span className="ml-1.5 font-medium normal-case tracking-normal">{t('guide.stepOf', { step: index + 1, total })}</span> : null}
            </span>
            <span className="flex-1" />
            {onBackToChat ? (
              <button
                type="button"
                onClick={onBackToChat}
                title={t('guide.backToChat')}
                aria-label={t('guide.backToChat')}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <FiMessageCircle size={15} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('guide.close')}
              title={t('guide.closeHint')}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <FiX size={15} />
            </button>
          </div>

          <h2 id={titleId} className="text-base font-semibold leading-snug">
            {step.title}
          </h2>

          {busy ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {phase === 'moving' ? t('guide.moving') : t('guide.locating')}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{missing ? t('guide.missing') : step.body}</p>
          )}

          <div className="mt-2 flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={onPrev}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiArrowLeft size={14} aria-hidden="true" />
                {t('guide.back')}
              </button>
            ) : null}
            {missing ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiRefreshCw size={13} aria-hidden="true" />
                {t('guide.retry')}
              </button>
            ) : null}
            <span className="flex-1" />
            {total > 1 ? (
              <span className="hidden text-[11px] text-zinc-400 lg:inline" aria-hidden="true">
                ← →
              </span>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primaryDark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            >
              {last ? (
                <>
                  <FiCheck size={14} aria-hidden="true" />
                  {t('guide.done')}
                </>
              ) : (
                <>
                  {t('guide.next')}
                  <FiArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
