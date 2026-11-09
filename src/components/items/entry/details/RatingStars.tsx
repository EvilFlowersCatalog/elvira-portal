import { useState } from 'react';
import { RiStarFill, RiStarHalfFill, RiStarLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const STARS = [1, 2, 3, 4, 5];

/** A read-only 0–5 rating, rounded to half stars. */
export const RatingStars = ({ value, size = 16, className }: { value: number; size?: number; className?: string }) => {
  const { t } = useTranslation();
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={twMerge('inline-flex items-center text-amber-500', className)}
      role="img"
      aria-label={t('entry.detail.reviews.starsLabel', { value: value.toFixed(1) })}
    >
      {STARS.map((star) =>
        rounded >= star ? (
          <RiStarFill key={star} size={size} />
        ) : rounded >= star - 0.5 ? (
          <RiStarHalfFill key={star} size={size} />
        ) : (
          <RiStarLine key={star} size={size} />
        )
      )}
    </span>
  );
};

/** Pick 1–5 stars. Keyboard: the stars are a radio group. */
export const RatingInput = ({
  value,
  onChange,
  size = 26,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  label?: string;
}) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div
      className="inline-flex items-center gap-0.5 text-amber-500"
      role="radiogroup"
      aria-label={label ?? t('entry.detail.reviews.yourRating')}
      onMouseLeave={() => setHover(null)}
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={t('entry.detail.reviews.starsLabel', { value: star })}
          className="p-0.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
        >
          {shown >= star ? <RiStarFill size={size} /> : <RiStarLine size={size} />}
        </button>
      ))}
    </div>
  );
};
