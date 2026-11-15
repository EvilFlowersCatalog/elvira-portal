import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiEdit3, FiMessageCircle } from 'react-icons/fi';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import useEscapeLayer from '../../hooks/useEscapeLayer';
import { figureContext, regionKind, useCropUrl } from './citationUi';
import FigureImage, { FigureMarksLegend } from './FigureImage';
import { figureMarks } from './figureMarks';

/**
 * A figure, table or equation an answer cites (`[F2]`), under the paragraph that cites it (IP-030 Phase 3): the
 * crop, the printed caption and the page, with "open in the reader" and "ask about this figure". The crop opens
 * large on click. Without a crop (Readium LCP, outside IP ranges) only the caption line and the buttons remain.
 *
 * When the assistant marked parts of the figure (`marks`), they are drawn over the crop with a numbered legend
 * underneath; the reader can hide them to see the figure as printed.
 */
export default function FigureCard({
  citation,
  onOpen,
  onAsk,
}: {
  citation: IAssistantCitation;
  onOpen?: (citation: IAssistantCitation) => void;
  /** Sends a question with the figure attached; omitted while an answer streams. */
  onAsk?: (citation: IAssistantCitation) => void;
}) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const [lightbox, setLightbox] = useState(false);
  const [showMarks, setShowMarks] = useState(true);
  const [activeMark, setActiveMark] = useState<number | null>(null);
  useEscapeLayer(() => setLightbox(false), lightbox);

  const image = cropUrl(citation.image_url);
  const kind = t(`assistant.region.${regionKind(citation)}`);
  const page = citation.page ? t('assistant.pageShort', { page: citation.page }) : '';
  const marks = figureMarks(citation);
  const alt = citation.caption ?? kind;

  const marksToggle = marks.length ? (
    <button
      type="button"
      onClick={() => setShowMarks((shown) => !shown)}
      aria-pressed={showMarks}
      className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline"
    >
      <FiEdit3 size={12} aria-hidden="true" /> {t(showMarks ? 'assistant.figure.hideMarks' : 'assistant.figure.showMarks')}
    </button>
  ) : null;
  // Without the crop the marks can't be drawn; what they say still helps.
  const legend = marks.length && (showMarks || !image) ? <FigureMarksLegend marks={marks} onActivate={setActiveMark} /> : null;

  return (
    <figure className="my-2 max-w-md rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 overflow-hidden">
      {image ? (
        <button
          type="button"
          className="flex w-full justify-center bg-white cursor-zoom-in"
          onClick={() => setLightbox(true)}
          aria-label={t('assistant.figure.enlarge')}
        >
          <FigureImage src={image} alt={alt} marks={marks} showMarks={showMarks} activeMark={activeMark} imgClassName="max-h-64 max-w-full" />
        </button>
      ) : null}
      <figcaption className="px-3 py-2 flex flex-col gap-1.5">
        <span className="text-xs text-black dark:text-white">
          <span className="font-semibold">{citation.label}</span>
          {citation.caption ? ` · ${citation.caption}` : ''}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {[kind, page, citation.title].filter(Boolean).join(' · ')}
        </span>
        {legend}
        <span className="flex flex-wrap gap-2">
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(citation)}
              className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline"
            >
              <FiBookOpen size={12} aria-hidden="true" /> {t('assistant.figure.open')}
            </button>
          ) : null}
          {onAsk && figureContext(citation) ? (
            <button
              type="button"
              onClick={() => onAsk(citation)}
              className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline"
            >
              <FiMessageCircle size={12} aria-hidden="true" /> {t('assistant.figure.ask')}
            </button>
          ) : null}
          {image ? marksToggle : null}
        </span>
      </figcaption>

      {lightbox && image
        ? createPortal(
            <div
              className="fixed inset-0 z-[1001] bg-black/75 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
              role="dialog"
              aria-modal="true"
              aria-label={alt}
            >
              <div
                className="max-w-5xl max-h-full overflow-auto bg-white dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-3"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex justify-center bg-white">
                  <FigureImage
                    src={image}
                    alt={alt}
                    marks={marks}
                    showMarks={showMarks}
                    activeMark={activeMark}
                    imgClassName="max-h-[70vh] max-w-full"
                  />
                </div>
                {legend}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-semibold">{citation.label}</span>
                    {citation.caption ? ` · ${citation.caption}` : ''}
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {[kind, page, citation.title].filter(Boolean).join(' · ')}
                    </span>
                  </p>
                  <span className="flex shrink-0 items-center gap-3">
                    {marksToggle}
                    <button
                      type="button"
                      autoFocus
                      onClick={() => setLightbox(false)}
                      className="text-xs px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
                    >
                      {t('assistant.figure.close')}
                    </button>
                  </span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </figure>
  );
}
