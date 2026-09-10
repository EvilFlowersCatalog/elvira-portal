import { BiCalendar } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

export type AvailabilityState = 'available' | 'borrowed' | 'reserved' | 'unavailable';

interface AvailabilityBadgeProps {
  state: AvailabilityState;
  date?: string | null;
  size?: 'small' | 'big';
  position?: number | null;
  days?: number | null;
}

// Text colors are chosen to meet WCAG AA (≥4.5:1) on their pastel backgrounds,
// and each state carries a dark-mode variant for theme consistency.
const CONFIGS = {
  available: {
    bg: 'bg-[#cfffd8] dark:bg-[#0f3d1a]',
    dot: 'bg-[#005e11] dark:bg-[#7ee49a]',
    text: 'text-[#005e11] dark:text-[#9ff0b4]',
  },
  borrowed: {
    bg: 'bg-[#cce6fe] dark:bg-[#0d2b47]',
    dot: 'bg-[#175a97] dark:bg-[#8fc4f5]',
    text: 'text-[#175a97] dark:text-[#a9d2f7]',
  },
  reserved: {
    bg: 'bg-[#feeecc] dark:bg-[#3d2f0a]',
    dot: 'bg-[#8a5e00] dark:bg-[#f0cd7a]',
    text: 'text-[#8a5e00] dark:text-[#f2d79a]',
  },
  unavailable: {
    bg: 'bg-[#ebebeb] dark:bg-neutral-700',
    dot: 'bg-[#575757] dark:bg-neutral-300',
    text: 'text-[#575757] dark:text-neutral-300',
  },
} as const;

export function AvailabilityBadge({ state, date, size = 'big', position, days }: AvailabilityBadgeProps) {
  const { t } = useTranslation();
  const config = CONFIGS[state];

  const formattedDate = date
    ? new Date(date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
    : null;

  const positionLabel = position != null
    ? t('entry.detail.availability.queuePosition', { position, defaultValue: `#${position}` })
    : null;
  const daysLabel = days != null
    ? t('entry.detail.availability.availableInDays', { days, defaultValue: `~${days}d` })
    : null;

  const baseLabel = t(`entry.detail.availability.${state}`);
  const smallLabel = [baseLabel, positionLabel, daysLabel].filter(Boolean).join(' · ');

  if (size === 'small') {
    return (
      <div className={`inline-flex items-center gap-[4px] h-[12px] px-[7px] rounded-[6px] ${config.bg} ${config.text}`}>
        <span className={`rounded-full size-[4.5px] shrink-0 ${config.dot}`} />
        <span className="text-[9px] tracking-[0.1px] whitespace-nowrap leading-none">
          {smallLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md text-xs leading-none shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] ${config.bg} ${config.text}`}
    >
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${config.dot}`} />
      {state === 'borrowed' ? (
        <span className="whitespace-nowrap">
          {t('entry.detail.availability.borrowedUntil')}{' '}
          <strong className="font-semibold">{formattedDate}</strong>
        </span>
      ) : (
        <>
          <span className="whitespace-nowrap">{baseLabel}</span>
          {positionLabel && (
            <>
              <span>|</span>
              <strong className="font-semibold whitespace-nowrap">{positionLabel}</strong>
            </>
          )}
          {daysLabel && (
            <>
              <span>|</span>
              <strong className="font-semibold whitespace-nowrap">{daysLabel}</strong>
            </>
          )}
          {formattedDate && (
            <>
              <span>|</span>
              <BiCalendar size={12} className="flex-shrink-0" />
              <strong className="font-semibold whitespace-nowrap">{formattedDate}</strong>
            </>
          )}
        </>
      )}
    </div>
  );
}
