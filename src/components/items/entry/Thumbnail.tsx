import { useState } from 'react';
import useAuthContext from '../../../hooks/contexts/useAuthContext';

const FALLBACK_SRC = '/assets/thumbnail.webp';

interface IThumbnailProps {
  /** Raw thumbnail URL from the API (token is appended here). */
  thumbnail?: string | null;
  alt: string;
  className?: string;
  /** Reserve space / neutral backdrop so the image fades in instead of popping. */
  wrapperClassName?: string;
  /** `object-cover` (default) or `object-contain`. */
  fit?: 'cover' | 'contain';
}

/**
 * Single source of truth for rendering an entry cover.
 *
 * Every call site previously inlined `entry.thumbnail + '?access_token=' + token`
 * with inconsistent (or missing) error handling — a 404 thumbnail (the backend
 * returns 404 + application/json, which the browser's ORB blocks) left a broken
 * image or flashed before swapping to a placeholder. This centralizes:
 *   - access-token query param,
 *   - native lazy loading + async decoding,
 *   - a neutral backdrop + opacity fade so covers never pop in, and
 *   - a single graceful fallback to the bundled placeholder.
 */
export default function Thumbnail({
  thumbnail,
  alt,
  className = '',
  wrapperClassName = '',
  fit = 'cover',
}: IThumbnailProps) {
  const { auth } = useAuthContext();
  const [loaded, setLoaded] = useState(false);

  const src = thumbnail
    ? `${thumbnail}?access_token=${auth?.token ?? ''}`
    : FALLBACK_SRC;

  return (
    <div
      className={`relative overflow-hidden bg-lightGray dark:bg-darkGray ${wrapperClassName}`}
    >
      <img
        className={`h-full w-full object-${fit} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (e.currentTarget.src.endsWith(FALLBACK_SRC)) return;
          e.currentTarget.src = FALLBACK_SRC;
          setLoaded(true);
        }}
      />
    </div>
  );
}
