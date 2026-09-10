import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';
import { RxCalendar } from 'react-icons/rx';
import { HiOutlineUsers } from 'react-icons/hi';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { IEntryDetail } from '../../utils/interfaces/entry';
import { problemDetailMessage } from '../../utils/problemDetail';
import useCreateReservation from '../../hooks/api/reservations/useCreateReservation';
import useContactNudge from '../../hooks/api/notification-contacts/useContactNudge';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const M = 'license.queue';

interface Props {
  entry: IEntryDetail;
  onClose: () => void;
  onSuccess: () => void;
  /** Fresher figures from a 409 borrow conflict override the (possibly stale) entry. */
  queueLength?: number;
  nextAvailableAt?: string | null;
}

/**
 * "Join the queue?" confirmation shown when every copy of an LCP title is on
 * loan — either from the Reserve CTA or after a borrow raced into a 409
 * `no_available_slots`. Confirming POSTs the reservation, reports the queue
 * position, and nudges users without a notification contact.
 */
export default function ReserveQueueModal({ entry, onClose, onSuccess, queueLength, nextAvailableAt }: Props) {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const createReservation = useCreateReservation();
  const nudgeIfNoContact = useContactNudge();
  const [loading, setLoading] = useState(false);
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const waiting = queueLength ?? entry.queue_length ?? 0;
  const nextAt = nextAvailableAt !== undefined ? nextAvailableAt : entry.next_available_at ?? null;

  const handleJoin = async () => {
    setLoading(true);
    try {
      const reservation = await createReservation(entry.id);
      toast.success(
        t(`${M}.joined`, {
          position: reservation.position,
          defaultValue: `You are #${reservation.position} in line. We'll email you when it's your turn.`,
        }),
      );
      onSuccess();
      onClose();
      await nudgeIfNoContact();
    } catch (e) {
      // A race (someone else reserved/borrowed meanwhile) 409s here too — the
      // server message says which rule tripped, so show it and refresh state.
      toast.error(problemDetailMessage(e, t(`${M}.joinFailed`, { defaultValue: 'Could not join the queue. Try again.' })));
      onSuccess();
      onClose();
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
        aria-labelledby="reserve-queue-title"
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

        <h2 id="reserve-queue-title" className="text-xl font-bold text-secondary dark:text-secondaryLight text-center mb-2">
          {t(`${M}.title`, { defaultValue: 'Join the waiting list?' })}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          {t(`${M}.allBorrowed`, {
            total: entry.total_slots ?? 0,
            defaultValue: `All ${entry.total_slots ?? 0} copies are currently on loan. We'll email you as soon as one is available for you.`,
          })}
        </p>

        {/* Book info card */}
        <div className="bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center mb-8">
          <div className="w-[55px] h-[78px] rounded-[5px] overflow-hidden bg-gray-300 shrink-0">
            {entry.thumbnail && (
              <img
                className="w-full h-full object-cover"
                src={`${entry.thumbnail}?access_token=${auth?.token}`}
                alt={entry.title}
              />
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="font-semibold text-sm text-secondary dark:text-secondaryLight truncate">
              {entry.title}
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#feeecc] border border-[#8a5e00] text-[#8a5e00]">
                <HiOutlineUsers size={12} className="shrink-0" />
                {t(`${M}.waiting`, { waitingCount: waiting, defaultValue: `Waiting: ${waiting}` })}
              </span>
              {nextAt && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#feeecc] border border-[#8a5e00] text-[#8a5e00]">
                  <RxCalendar size={12} className="shrink-0" />
                  {t(`${M}.nextReturn`, {
                    date: format(parseISO(nextAt), 'd. M. yyyy'),
                    defaultValue: `Next return expected ~${format(parseISO(nextAt), 'd. M. yyyy')}`,
                  })}
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
            {t(`${M}.dismiss`, { defaultValue: 'Not now' })}
          </button>
          <button
            disabled={loading}
            className="h-[35px] w-[170px] rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors disabled:opacity-60 shadow"
            onClick={handleJoin}
          >
            {loading
              ? t(`${M}.joining`, { defaultValue: 'Joining…' })
              : t(`${M}.join`, { defaultValue: 'Join the queue' })}
          </button>
        </div>
      </div>
    </div>
  );
}
