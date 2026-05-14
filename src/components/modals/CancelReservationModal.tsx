import { useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { RxCalendar } from 'react-icons/rx';
import { HiOutlineUsers } from 'react-icons/hi';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ILicense } from '../../utils/interfaces/license';
import useCancelReservation from '../../hooks/api/reservations/useCancelReservation';

interface Props {
  license: ILicense;
  onClose: () => void;
  onSuccess: () => void;
  queuePosition?: number;
  queueTotal?: number;
}

export default function CancelReservationModal({ license, onClose, onSuccess, queuePosition = 1, queueTotal = 3 }: Props) {
  const [loading, setLoading] = useState(false);
  const cancelReservation = useCancelReservation();

  const expiresAt = license.expires_at ? parseISO(license.expires_at) : null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelReservation(license.id);
      toast.success('Rezervácia bola zrušená.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Zrušenie zlyhalo. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-[600px] mx-4 py-6 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={onClose}>
          <RiCloseLine size={24} />
        </button>

        <h2 className="text-xl font-bold text-secondary dark:text-secondaryLight text-center mb-6">
          Naozaj chcete zrušiť rezerváciu?
        </h2>

        {/* Book info card */}
        <div className="bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center mb-8">
          <div className="w-[55px] h-[78px] rounded-[5px] bg-gray-300 shrink-0" />
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="font-semibold text-sm text-secondary dark:text-secondaryLight truncate">
              {license.entry?.title || 'Neznámy titul'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#ffe5dd] border border-[#c30000] text-[#c30000]">
                <HiOutlineUsers size={12} className="shrink-0" />
                Vaše poradie: {queuePosition}. /{queueTotal}
              </span>
              {expiresAt && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#ffe5dd] border border-[#c30000] text-[#c30000]">
                  <RxCalendar size={12} className="shrink-0" />
                  Odhadovaná dostupnosť: {format(expiresAt, 'd. M. yyyy')}
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
            Ponechať rezerváciu
          </button>
          <button
            disabled={loading}
            className="h-[35px] w-[170px] rounded-[7px] bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 shadow"
            onClick={handleCancel}
          >
            {loading ? 'Ruším...' : 'Zrušiť rezerváciu'}
          </button>
        </div>
      </div>
    </div>
  );
}
