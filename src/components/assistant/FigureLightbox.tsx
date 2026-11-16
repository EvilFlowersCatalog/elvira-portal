import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiImage,
  FiLink,
  FiMessageCircle,
  FiX,
} from 'react-icons/fi';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import useEscapeLayer from '../../hooks/useEscapeLayer';
import { copyText } from '../../utils/func/clipboard';
import { figureContext, figureLink, figureName, hasRegionData, regionKind, useCropUrl } from './citationUi';
import FigureImage, { FigureMarksLegend } from './FigureImage';
import { figureMarks } from './figureMarks';
import RegionData from './RegionData';

const action =
  'inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline disabled:opacity-50';

/**
 * The figures of one answer, large, one at a time (IP-030 Phase 3, extended): the crop with the assistant's marks
 * and their legend, the printed caption, a table's cells or an equation's LaTeX when extracted, and the actions —
 * open in the reader, ask about it, copy a durable link. (No "open the image" link: the crop URL carries the
 * access token, which a new tab would leave in the history.) ← / → and the side buttons step through
 * every figure of the answer, so a cited figure and the gallery around it read as one set.
 */
export default function FigureLightbox({
  figures,
  index,
  onIndex,
  onClose,
  onOpen,
  onAsk,
}: {
  figures: IAssistantCitation[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onOpen?: (citation: IAssistantCitation) => void;
  onAsk?: (citation: IAssistantCitation) => void;
}) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const [showMarks, setShowMarks] = useState(true);
  const [activeMark, setActiveMark] = useState<number | null>(null);
  const [view, setView] = useState<'image' | 'data'>('image');
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  useEscapeLayer(onClose, true);

  const count = figures.length;
  const figure = figures[Math.min(Math.max(index, 0), count - 1)];
  const step = (delta: number) => count > 1 && onIndex((index + delta + count) % count);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Each figure opens on its image, with its own marks highlighted afresh.
  useEffect(() => {
    setView('image');
    setActiveMark(null);
  }, [index]);

  if (!figure) return null;
  const image = failed.has(figure.label) ? undefined : cropUrl(figure.image_url);
  const marks = figureMarks(figure);
  const name = figureName(figure, t);
  const kind = t(`assistant.region.${regionKind(figure)}`);
  const page = figure.page ? t('assistant.pageShort', { page: figure.page }) : '';
  const data = hasRegionData(figure);
  const link = figureLink(figure);
  const alt = figure.caption ?? name;
  const canOpen = onOpen && !(figure.readable === false && !figure.page);

  const sideButton = (delta: number) =>
    count > 1 ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          step(delta);
        }}
        aria-label={t(delta > 0 ? 'assistant.figure.next' : 'assistant.figure.previous')}
        className={`absolute top-1/2 -translate-y-1/2 ${delta > 0 ? 'right-2' : 'left-2'} z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white`}
      >
        {delta > 0 ? <FiChevronRight size={20} aria-hidden="true" /> : <FiChevronLeft size={20} aria-hidden="true" />}
      </button>
    ) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1301] bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="relative w-full max-w-5xl max-h-full overflow-auto bg-white dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-black dark:text-white min-w-0">
            <span className="font-semibold">{name}</span>
            <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">{figure.label}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {[figure.printed_label ? kind : '', page, figure.title].filter(Boolean).join(' · ')}
            </span>
          </p>
          <span className="flex shrink-0 items-center gap-3">
            {count > 1 ? (
              <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                {t('assistant.figure.position', { index: index + 1, count })}
              </span>
            ) : null}
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label={t('assistant.figure.close')}
              className="p-1 rounded-md bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
            >
              <FiX size={16} aria-hidden="true" />
            </button>
          </span>
        </div>

        {data ? (
          <div role="tablist" className="flex gap-1 text-xs">
            {(['image', 'data'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={view === tab}
                onClick={() => setView(tab)}
                className={`px-2.5 py-1 rounded-md ${
                  view === tab
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black'
                    : 'bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t(tab === 'image' ? 'assistant.figure.viewImage' : 'assistant.figure.viewData')}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative">
          {sideButton(-1)}
          {view === 'data' && data ? (
            <div className="px-10">
              <RegionData citation={figure} />
            </div>
          ) : image ? (
            <div className="flex justify-center bg-white rounded">
              <FigureImage
                key={figure.label}
                src={image}
                alt={alt}
                marks={marks}
                showMarks={showMarks}
                activeMark={activeMark}
                imgClassName="max-h-[65vh] max-w-full"
                onError={() => setFailed((prev) => new Set(prev).add(figure.label))}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-48 rounded bg-zinc-100 dark:bg-zinc-800 text-sm text-gray-500 dark:text-gray-400 px-12 text-center">
              <FiImage size={24} aria-hidden="true" />
              {t(figure.readable === false ? 'assistant.figure.borrowToSee' : 'assistant.figure.noImage')}
            </div>
          )}
          {sideButton(1)}
        </div>

        {view === 'image' && marks.length && showMarks ? (
          <FigureMarksLegend marks={marks} onActivate={setActiveMark} />
        ) : null}
        {figure.caption ? <p className="text-sm text-black dark:text-white">{figure.caption}</p> : null}
        {figure.description && figure.description !== figure.caption ? (
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{t('assistant.figure.described')}</span> {figure.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {canOpen ? (
            <button type="button" className={action} onClick={() => onOpen!(figure)}>
              <FiBookOpen size={12} aria-hidden="true" /> {t('assistant.figure.open')}
            </button>
          ) : null}
          {onAsk && figureContext(figure) ? (
            <button
              type="button"
              className={action}
              onClick={() => {
                onAsk(figure);
                onClose();
              }}
            >
              <FiMessageCircle size={12} aria-hidden="true" /> {t('assistant.figure.ask')}
            </button>
          ) : null}
          {marks.length && image && view === 'image' ? (
            <button type="button" className={action} onClick={() => setShowMarks((shown) => !shown)} aria-pressed={showMarks}>
              <FiEdit3 size={12} aria-hidden="true" /> {t(showMarks ? 'assistant.figure.hideMarks' : 'assistant.figure.showMarks')}
            </button>
          ) : null}
          {link ? (
            <button type="button" className={action} onClick={() => copyText(link, t('assistant.figure.copied'))}>
              <FiLink size={12} aria-hidden="true" /> {t('assistant.figure.copyLink')}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
