import { ReactNode, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useEscapeLayer from '../../hooks/useEscapeLayer';

/** What a `[[region:ID]]` citation knows about its figure, table or equation. */
export interface CitedRegion {
  kind: 'figure' | 'table' | 'equation';
  page: number;
  caption?: string | null;
  description?: string | null;
  /** Crop with the access token, so an <img> can load it. */
  imageUrl?: string | null;
}

const PREVIEW_WIDTH = 288;

/**
 * A region citation in a chat answer. Hovering (or focusing) shows the crop; clicking the crop opens it
 * large in a lightbox; clicking the chip opens the publication in the viewer at the region's page.
 */
export default function RegionCite({
  region,
  className,
  onOpenPage,
  children,
}: {
  region: CitedRegion | null;
  className: string;
  onOpenPage?: (page: number) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const anchor = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [preview, setPreview] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  useEscapeLayer(() => setLightbox(false), lightbox);

  const caption = region?.caption || null;
  const hasPreview = !!region?.imageUrl || !!caption;

  const show = () => {
    window.clearTimeout(hideTimer.current);
    if (!hasPreview || !anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - PREVIEW_WIDTH - 8);
    // Above the chip when there is room, the chat input sits below it.
    const above = rect.top > 280;
    setPreview({ left, top: above ? rect.top - 6 : rect.bottom + 6, above });
  };
  // A short delay lets the pointer travel from the chip onto the preview.
  const hide = () => {
    hideTimer.current = window.setTimeout(() => setPreview(null), 150);
  };

  const pageLabel = region ? t('assistant.pageShort', { page: region.page }) : null;

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={className}
        disabled={!region || (!onOpenPage && !hasPreview)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => {
          if (!region) return;
          if (onOpenPage) onOpenPage(region.page);
          else if (region.imageUrl) setLightbox(true);
        }}
        title={onOpenPage && pageLabel ? t('assistant.regionPreview.open', { page: pageLabel }) : undefined}
      >
        {children}
      </button>

      {preview && region
        ? createPortal(
            <div
              role="tooltip"
              onMouseEnter={() => window.clearTimeout(hideTimer.current)}
              onMouseLeave={hide}
              style={{
                left: preview.left,
                top: preview.top,
                width: PREVIEW_WIDTH,
                transform: preview.above ? 'translateY(-100%)' : undefined,
              }}
              className="fixed z-[1000] rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden text-left"
            >
              {region.imageUrl ? (
                <button
                  type="button"
                  className="block w-full bg-white cursor-zoom-in"
                  onClick={() => {
                    setPreview(null);
                    setLightbox(true);
                  }}
                  title={t('assistant.regionPreview.enlarge')}
                >
                  <img src={region.imageUrl} alt={caption ?? ''} className="w-full max-h-48 object-contain" />
                </button>
              ) : null}
              <div className="px-2.5 py-1.5 flex flex-col gap-0.5">
                {caption ? <p className="text-xs font-medium text-black dark:text-white line-clamp-2">{caption}</p> : null}
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t(`assistant.region.${region.kind}`)} · {pageLabel}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}

      {lightbox && region?.imageUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[1001] bg-black/70 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="max-w-4xl max-h-full overflow-auto bg-white dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-3"
                onClick={(event) => event.stopPropagation()}
              >
                <img src={region.imageUrl} alt={caption ?? ''} className="max-h-[70vh] object-contain bg-white" />
                {caption ? <p className="text-sm font-medium text-black dark:text-white">{caption}</p> : null}
                {region.description && region.description !== caption ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{region.description}</p>
                ) : null}
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t(`assistant.region.${region.kind}`)} · {pageLabel}
                  </span>
                  {onOpenPage ? (
                    <button
                      type="button"
                      className="text-sky-700 dark:text-sky-300 hover:underline"
                      onClick={() => {
                        setLightbox(false);
                        onOpenPage(region.page);
                      }}
                    >
                      {t('assistant.regionPreview.openShort')}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
