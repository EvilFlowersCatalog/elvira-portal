import { BiCalendar } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

export type AvailabilityState = 'available' | 'borrowed' | 'reserved' | 'unavailable';

interface AvailabilityBadgeProps {
  state: AvailabilityState;
  date?: string | null;
}

const CONFIGS = {
  available: {
    bg: 'bg-[#cfffd8]',
    dot: 'bg-[#005e11]',
    text: 'text-[#005e11]',
  },
  borrowed: {
    bg: 'bg-[#cce6fe]',
    dot: 'bg-[#1e6cb4]',
    text: 'text-[#1e6cb4]',
  },
  reserved: {
    bg: 'bg-[#feeecc]',
    dot: 'bg-[#efb230]',
    text: 'text-[#9f6c00]',
  },
  unavailable: {
    bg: 'bg-[#ebebeb] dark:bg-neutral-700',
    dot: 'bg-[#8a8a8a]',
    text: 'text-[#575757] dark:text-neutral-300',
  },
} as const;

export function AvailabilityBadge({ state, date }: AvailabilityBadgeProps) {
  const { t } = useTranslation();
  const config = CONFIGS[state];

  const formattedDate = date
    ? new Date(date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
    : null;

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
          <span className="whitespace-nowrap">{t(`entry.detail.availability.${state}`)}</span>
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
