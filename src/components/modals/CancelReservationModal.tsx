import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';
import { RxCalendar } from 'react-icons/rx';
import { HiOutlineUsers } from 'react-icons/hi';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { IReservation, RESERVATION_STATUS } from '../../utils/interfaces/reservation';
import { problemDetailMessage } from '../../utils/problemDetail';
import useUpdateReservation from '../../hooks/api/reservations/useUpdateReservation';
import useFocusTrap from '../../hooks/useFocusTrap';

const M = 'license.loansPage.modals';

interface Props {
  reservation: IReservation;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Confirmation before a queue reservation is cancelled (PATCH `cancelled`).
 * Cancelling reflows the positions of everyone behind, so it must not happen
 * on a stray click.
 */
export default function CancelReservationModal({ reservation, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { cancelReservation } = useUpdateReservation();
  const { t } = useTranslation();
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isAvailable = reservation.status === RESERVATION_STATUS.available;
  const estimatedFrom = reservation.entry?.next_available_at
    ? parseISO(reservation.entry.next_available_at)
    : null;
  const queueTotal = reservation.entry?.queue_length ?? reservation.position;

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelReservation(reservation.id);
      toast.success(t(`${M}.cancelSuccess`, { defaultValue: 'The reservation was cancelled.' }));
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(problemDetailMessage(e, t(`${M}.cancelFailed`, { defaultValue: 'Cancellation failed. Please try again.' })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-reservation-title"
        className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-[600px] mx-4 py-6 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          onClick={onClose}
        >
          <RiCloseLine size={24} aria-hidden="true" />
        </button>

        <h2 id="cancel-reservation-title" className="text-xl font-bold text-secondary dark:text-secondaryLight text-center mb-6">
          {t(`${M}.cancelTitle`, { defaultValue: 'Do you really want to cancel the reservation?' })}
        </h2>

        {/* Book info card */}
        <div className="bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center mb-8">
          <div className="w-[55px] h-[78px] rounded-[5px] bg-gray-300 shrink-0" />
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="font-semibold text-sm text-secondary dark:text-secondaryLight truncate">
              {reservation.entry?.title || t(`${M}.unknownTitle`, { defaultValue: 'Unknown title' })}
            </p>
            <div className="flex gap-2 flex-wrap">
              {!isAvailable && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#ffe5dd] border border-[#c30000] text-[#c30000]">
                  <HiOutlineUsers size={12} className="shrink-0" />
                  {t(`${M}.queuePosition`, { defaultValue: 'Your position:' })} {reservation.position}. /{queueTotal}
                </span>
              )}
              {!isAvailable && estimatedFrom && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#ffe5dd] border border-[#c30000] text-[#c30000]">
                  <RxCalendar size={12} className="shrink-0" />
                  {t(`${M}.estimatedAvailability`, { defaultValue: 'Estimated availability:' })} {format(estimatedFrom, 'd. M. yyyy')}
                </span>
              )}
              {isAvailable && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#ffe5dd] border border-[#c30000] text-[#c30000]">
                  <RxCalendar size={12} className="shrink-0" />
                  {t(`${M}.availableNowWarning`, { defaultValue: 'This copy is ready for you — cancelling passes it to the next person in line.' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-12">
          <button
            className="h-[35px] w-[170px] rounded-[7px] bg-lightGray border border-[rgba(0,0,0,0.1)] text-[#333] dark:text-white dark:bg-zinc-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            {t(`${M}.keepReservation`, { defaultValue: 'Keep the reservation' })}
          </button>
          <button
            disabled={loading}
            className="h-[35px] w-[170px] rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors disabled:opacity-60 shadow"
            onClick={handleCancel}
          >
            {loading
              ? t(`${M}.cancelling`, { defaultValue: 'Cancelling...' })
              : t(`${M}.cancelReservation`, { defaultValue: 'Cancel the reservation' })}
          </button>
        </div>
      </div>
    </div>
  );
}
