import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiEdit3, FiGrid, FiImage, FiMessageCircle } from 'react-icons/fi';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import { figureContext, figureName, hasRegionData, regionKind, useCropUrl } from './citationUi';
import FigureImage, { FigureMarksLegend } from './FigureImage';
import FigureLightbox from './FigureLightbox';
import { figureMarks } from './figureMarks';
import RegionData from './RegionData';

const action = 'inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline';

/**
 * A figure, table or equation an answer cites (`[F2]`), under the paragraph that cites it (IP-030 Phase 3): the
 * crop, named by its printed label ("Table 8.1"), the caption and the page, with "open in the reader" and "ask
 * about this figure". The crop opens large on click — in the answer's lightbox (`onEnlarge`) when the answer has
 * several figures, so the reader can step through all of them, else in its own.
 *
 * A crop that fails to load (403 outside the IP ranges, 404 after re-extraction) gives way to a caption-only card
 * instead of a broken image. A table's extracted cells or an equation's LaTeX, when the catalog sent them, are a
 * secondary "data" view: the extraction is automatic and the image stays the primary, faithful one.
 *
 * When the assistant marked parts of the figure (`marks`), they are drawn over the crop with a numbered legend
 * underneath; the reader can hide them to see the figure as printed.
 */
export default function FigureCard({
  citation,
  onOpen,
  onAsk,
  onEnlarge,
}: {
  citation: IAssistantCitation;
  onOpen?: (citation: IAssistantCitation) => void;
  /** Sends a question with the figure attached; omitted while an answer streams. */
  onAsk?: (citation: IAssistantCitation) => void;
  /** Opens the answer's lightbox at this figure; without it the card opens a lightbox of its own. */
  onEnlarge?: (citation: IAssistantCitation) => void;
}) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const [lightbox, setLightbox] = useState(false);
  const [showMarks, setShowMarks] = useState(true);
  const [showData, setShowData] = useState(false);
  const [activeMark, setActiveMark] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);

  const image = broken ? undefined : cropUrl(citation.image_url);
  const name = figureName(citation, t);
  const kind = t(`assistant.region.${regionKind(citation)}`);
  const page = citation.page ? t('assistant.pageShort', { page: citation.page }) : '';
  const marks = figureMarks(citation);
  const alt = citation.caption ?? name;
  const data = hasRegionData(citation);
  const enlarge = () => (onEnlarge ? onEnlarge(citation) : setLightbox(true));

  // Without the crop the marks can't be drawn; what they say still helps.
  const legend = marks.length && (showMarks || !image) ? <FigureMarksLegend marks={marks} onActivate={setActiveMark} /> : null;

  return (
    <figure className="my-2 max-w-md rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 overflow-hidden">
      {image ? (
        <button
          type="button"
          className="flex w-full justify-center bg-white cursor-zoom-in"
          onClick={enlarge}
          aria-label={t('assistant.figure.enlarge')}
        >
          <FigureImage
            src={image}
            alt={alt}
            marks={marks}
            showMarks={showMarks}
            activeMark={activeMark}
            imgClassName="max-h-64 max-w-full"
            onError={() => setBroken(true)}
          />
        </button>
      ) : citation.image_url ? (
        // The crop was sent but did not load: say so, rather than leave a broken image.
        <div className="flex items-center gap-1.5 px-3 pt-2 text-[11px] text-gray-500 dark:text-gray-400">
          <FiImage size={12} aria-hidden="true" /> {t('assistant.figure.noImage')}
        </div>
      ) : null}
      <figcaption className="px-3 py-2 flex flex-col gap-1.5">
        <span className="text-xs text-black dark:text-white">
          <span className="font-semibold">{name}</span>
          {citation.caption && citation.caption !== name ? ` · ${citation.caption}` : ''}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {[citation.label, citation.printed_label ? kind : '', page, citation.title].filter(Boolean).join(' · ')}
        </span>
        {legend}
        {showData && data ? <RegionData citation={citation} /> : null}
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {onOpen ? (
            <button type="button" onClick={() => onOpen(citation)} className={action}>
              <FiBookOpen size={12} aria-hidden="true" /> {t('assistant.figure.open')}
            </button>
          ) : null}
          {onAsk && figureContext(citation) ? (
            <button type="button" onClick={() => onAsk(citation)} className={action}>
              <FiMessageCircle size={12} aria-hidden="true" /> {t('assistant.figure.ask')}
            </button>
          ) : null}
          {data ? (
            <button type="button" onClick={() => setShowData((shown) => !shown)} aria-pressed={showData} className={action}>
              <FiGrid size={12} aria-hidden="true" />{' '}
              {t(showData ? 'assistant.figure.hideData' : regionKind(citation) === 'equation' ? 'assistant.figure.showLatex' : 'assistant.figure.showData')}
            </button>
          ) : null}
          {image && marks.length ? (
            <button type="button" onClick={() => setShowMarks((shown) => !shown)} aria-pressed={showMarks} className={action}>
              <FiEdit3 size={12} aria-hidden="true" /> {t(showMarks ? 'assistant.figure.hideMarks' : 'assistant.figure.showMarks')}
            </button>
          ) : null}
        </span>
      </figcaption>

      {lightbox ? (
        <FigureLightbox
          figures={[citation]}
          index={0}
          onIndex={() => {}}
          onClose={() => setLightbox(false)}
          onOpen={onOpen}
          onAsk={onAsk}
        />
      ) : null}
    </figure>
  );
}
