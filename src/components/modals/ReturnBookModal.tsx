import { useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { RxCalendar } from 'react-icons/rx';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { ILicense, LICENSE_ACTION } from '../../utils/interfaces/license';
import useUpdateLicenseState from '../../hooks/api/licenses/useUpdateLicense';
import useAuthContext from '../../hooks/contexts/useAuthContext';

interface Props {
  license: ILicense;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnBookModal({ license, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const updateLicense = useUpdateLicenseState();
  const { auth } = useAuthContext();

  const expiresAt = parseISO(license.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const daysWord = daysLeft === 1 ? 'deň' : daysLeft >= 2 && daysLeft <= 4 ? 'dni' : 'dní';

  const handleReturn = async () => {
    setLoading(true);
    try {
      await updateLicense(license.id, LICENSE_ACTION.returned);
      toast.success('Kniha bola úspešne vrátená.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Vrátenie zlyhalo. Skúste to znova.');
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
          Naozaj chcete vrátiť knihu?
        </h2>

        {/* Book info card */}
        <div className="bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center mb-8">
          {license.entry?.thumbnail ? (
            <img
              src={`${license.entry.thumbnail}?access_token=${auth?.token}`}
              alt={license.entry.title}
              className="w-[55px] h-[78px] rounded-[5px] object-cover shrink-0"
            />
          ) : (
            <div className="w-[55px] h-[78px] rounded-[5px] bg-gray-300 shrink-0" />
          )}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="font-semibold text-sm text-secondary dark:text-secondaryLight truncate">
              {license.entry?.title || 'Neznámy titul'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#1e6cb4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e6cb4] shrink-0" />
                Požičané do: {format(expiresAt, 'd. M. yyyy')}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#1e6cb4]">
                <RxCalendar size={12} className="shrink-0" />
                Zostáva: {daysLeft} {daysWord}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-12">
          <button
            className="h-[35px] w-[170px] rounded-[7px] bg-lightGray border border-[rgba(0,0,0,0.1)] text-[#333] dark:text-white dark:bg-zinc-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            Ponechať knihu
          </button>
          <button
            disabled={loading}
            className="h-[35px] w-[170px] rounded-[7px] bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 shadow"
            onClick={handleReturn}
          >
            {loading ? 'Vraciam...' : 'Vrátiť knihu'}
          </button>
        </div>
      </div>
    </div>
  );
}
