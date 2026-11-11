import { ReactNode, useState } from 'react';

export const FALLBACK_SRC = '/assets/thumbnail.webp';

interface IThumbnailProps {
  /**
   * Thumbnail URL exactly as the API returns it (`null` when the entry has none).
   * It is used verbatim: no access token, no added or reordered parameters. The
   * catalog serves covers without authentication and versions them (`?v=<hash>`),
   * so a stable URL is what lets the browser and gateway caches hit.
   */
  thumbnail?: string | null;
  alt: string;
  className?: string;
  /** Size, rounding and backdrop of the box the cover sits in. */
  wrapperClassName?: string;
  /** `object-cover` (default) or `object-contain`. */
  fit?: 'cover' | 'contain';
  /**
   * Above-the-fold cover (the first visible row of the home page): load eagerly
   * with high fetch priority for LCP. Everything else lazy-loads.
   */
  priority?: boolean;
  /** Rendered instead of the bundled placeholder when there is no cover or it fails to load. */
  fallback?: ReactNode;
}

/**
 * Single source of truth for rendering an entry cover. No component builds a
 * cover `<img>` on its own; this centralizes:
 *   - using the API's URL verbatim (cacheable, no bearer token in URLs/logs),
 *   - native lazy loading (eager + high priority for above-the-fold covers),
 *   - intrinsic 3:4 dimensions so a cover in an auto-height box never shifts layout,
 *   - a neutral backdrop + opacity fade so covers never pop in, and
 *   - a single graceful fallback for a missing (`null`) or broken cover.
 */
export default function Thumbnail({
  thumbnail,
  alt,
  className = '',
  wrapperClassName = '',
  fit = 'cover',
  priority = false,
  fallback,
}: IThumbnailProps) {
  // Keyed by URL, so a recycled component showing another entry starts fresh.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const src = thumbnail || null;
  const showFallback = src == null || failedSrc === src;

  return (
    <div
      className={`relative overflow-hidden bg-lightGray dark:bg-darkGray ${wrapperClassName}`}
    >
      {showFallback && fallback !== undefined ? (
        fallback
      ) : (
        <img
          // Filter too, so a caller's grayscale/hover effect fades like the opacity.
          className={`h-full w-full object-${fit} transition-[opacity,filter] duration-300 ${
            showFallback || loadedSrc === src ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          src={showFallback ? FALLBACK_SRC : src}
          alt={alt}
          width={300}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => {
            if (!showFallback) setFailedSrc(src);
          }}
        />
      )}
    </div>
  );
}
