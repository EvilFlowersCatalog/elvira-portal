import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiImage } from 'react-icons/fi';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import { figureName, useCropUrl } from './citationUi';

/** One thumbnail: the crop on white (figures are printed on white in both themes), else a kind tile. */
function Thumb({ figure, onClick }: { figure: IAssistantCitation; onClick: () => void }) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const [broken, setBroken] = useState(false);
  const image = broken ? undefined : cropUrl(figure.image_url);
  const name = figureName(figure, t);
  return (
    <li className="w-36 shrink-0">
      <button
        type="button"
        onClick={onClick}
        title={figure.caption ?? name}
        className="group w-full flex flex-col gap-1 text-left rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-1.5 hover:border-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <span className="flex h-24 items-center justify-center overflow-hidden rounded bg-white">
          {image ? (
            <img
              src={image}
              alt={figure.caption ?? name}
              loading="lazy"
              onError={() => setBroken(true)}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <FiImage size={22} className="text-zinc-400" aria-hidden="true" />
          )}
        </span>
        <span className="text-[11px] font-semibold text-black dark:text-white truncate">{name}</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {[figure.page ? t('assistant.pageShort', { page: figure.page }) : '', figure.title].filter(Boolean).join(' · ')}
        </span>
      </button>
    </li>
  );
}

/**
 * Figures as a row of thumbnails; a click opens the answer's lightbox at that figure.
 *
 * - `shown`: the figures the assistant chose to show (`show_figures`), under a heading, always open.
 * - `sources`: figures the turn found but the answer did not cite ("the figures behind the answer", as Consensus
 *   shows the charts of the papers it cites), folded behind one line until the reader asks for them.
 */
export default function FigureGallery({
  figures,
  variant,
  onEnlarge,
}: {
  figures: IAssistantCitation[];
  variant: 'shown' | 'sources';
  onEnlarge: (citation: IAssistantCitation) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(variant === 'shown');
  if (!figures.length) return null;

  const strip = (
    <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={t('assistant.figure.gallery')}>
      {figures.map((figure) => (
        <Thumb key={figure.label} figure={figure} onClick={() => onEnlarge(figure)} />
      ))}
    </ul>
  );

  if (variant === 'shown') {
    return (
      <section className="flex flex-col gap-1.5 w-full max-w-[85%]">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {t('assistant.figure.galleryTitle', { count: figures.length })}
        </h4>
        {strip}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[85%] text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 self-start rounded px-1 py-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <FiImage size={12} aria-hidden="true" />
        {t('assistant.figure.fromSources', { count: figures.length })}
        <FiChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? strip : null}
    </div>
  );
}
