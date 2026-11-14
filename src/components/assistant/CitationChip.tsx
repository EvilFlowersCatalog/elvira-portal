import { ReactNode, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import { isFigure } from '../../utils/func/assistantMessages';
import { citeClass, useCropUrl } from './citationUi';

const CARD_WIDTH = 300;

/**
 * An evidence chip in an answer (`[E3]`, `[F2]`). Hover or keyboard focus shows a card with the title, page,
 * section and quote — or, for a figure, its crop and caption — all from the citation object, so no request is
 * made (IP-030 Phase 2). Click or Enter opens the citation. Without a citation (still streaming, or a label the
 * catalog could not resolve) the chip is inert.
 */
export default function CitationChip({
  citation,
  onOpen,
  children,
}: {
  citation?: IAssistantCitation;
  onOpen: (citation: IAssistantCitation) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const anchor = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [card, setCard] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const cardId = useId();

  if (!citation) {
    return (
      <span className={`${citeClass} opacity-60`} title={t('assistant.cite.pending')}>
        {children}
      </span>
    );
  }

  const figure = isFigure(citation);
  const image = figure ? cropUrl(citation.image_url) : undefined;
  const where = [citation.page ? t('assistant.pageShort', { page: citation.page }) : '', citation.section ?? '']
    .filter(Boolean)
    .join(' · ');
  const text = figure ? citation.caption : citation.quote;

  const show = () => {
    window.clearTimeout(hideTimer.current);
    if (!anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - CARD_WIDTH - 8);
    // Above the chip when there is room: the chat input sits below it.
    const above = rect.top > 260;
    setCard({ left, top: above ? rect.top - 6 : rect.bottom + 6, above });
  };
  // A short delay lets the pointer travel from the chip onto the card.
  const hide = () => {
    hideTimer.current = window.setTimeout(() => setCard(null), 150);
  };

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={citeClass}
        aria-describedby={card ? cardId : undefined}
        aria-label={[citation.label, citation.title, where].filter(Boolean).join(', ')}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setCard(null);
        }}
        onClick={() => {
          setCard(null);
          onOpen(citation);
        }}
      >
        {children}
      </button>
      {card
        ? createPortal(
            <div
              id={cardId}
              role="tooltip"
              onMouseEnter={() => window.clearTimeout(hideTimer.current)}
              onMouseLeave={hide}
              style={{
                left: card.left,
                top: card.top,
                width: CARD_WIDTH,
                transform: card.above ? 'translateY(-100%)' : undefined,
              }}
              className="fixed z-[1000] rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden text-left"
            >
              {image ? (
                <img src={image} alt={citation.caption ?? ''} className="w-full max-h-44 object-contain bg-white" />
              ) : null}
              <div className="px-3 py-2 flex flex-col gap-1">
                <p className="text-xs font-semibold text-black dark:text-white line-clamp-2">
                  {citation.title ?? citation.entry_id}
                </p>
                {where ? <p className="text-[11px] text-gray-500 dark:text-gray-400">{where}</p> : null}
                {text ? (
                  <p className={`text-xs text-gray-700 dark:text-gray-300 line-clamp-3 ${figure ? '' : 'italic'}`}>
                    {figure ? text : `„${text}“`}
                  </p>
                ) : citation.readable === false ? (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('assistant.cite.borrow')}</p>
                ) : null}
                <p className="text-[11px] text-sky-700 dark:text-sky-300">
                  {citation.readable === false ? t('assistant.cite.openDetail') : t('assistant.cite.open')}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
