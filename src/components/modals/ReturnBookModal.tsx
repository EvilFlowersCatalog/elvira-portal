import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';
import { RxCalendar } from 'react-icons/rx';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { ILicense, LICENSE_ACTION } from '../../utils/interfaces/license';
import { problemDetailMessage } from '../../utils/problemDetail';
import useUpdateLicenseState from '../../hooks/api/licenses/useUpdateLicense';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const M = 'license.loansPage.modals';

interface Props {
  license: ILicense;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnBookModal({ license, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const updateLicense = useUpdateLicenseState();
  const { auth } = useAuthContext();
  const { t } = useTranslation();
  const dialogRef = useFocusTrap(true);

  // Accessibility: dismiss on Escape (WCAG 2.1.2 no keyboard trap / expected dialog behavior)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const expiresAt = parseISO(license.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());

  const handleReturn = async () => {
    setLoading(true);
    try {
      await updateLicense(license.id, LICENSE_ACTION.returned);
      toast.success(t(`${M}.returnSuccess`, { defaultValue: 'The book was returned successfully.' }));
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(problemDetailMessage(e, t(`${M}.returnFailed`, { defaultValue: 'Return failed. Please try again.' })));
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
        aria-labelledby="return-book-title"
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

        <h2 id="return-book-title" className="text-xl font-bold text-secondary dark:text-secondaryLight text-center mb-6">
          {t(`${M}.returnTitle`, { defaultValue: 'Do you really want to return the book?' })}
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
              {license.entry?.title || t(`${M}.unknownTitle`, { defaultValue: 'Unknown title' })}
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#175a97]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e6cb4] shrink-0" />
                {t(`${M}.borrowedUntil`, { defaultValue: 'Borrowed until:' })} {format(expiresAt, 'd. M. yyyy')}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#175a97]">
                <RxCalendar size={12} className="shrink-0" />
                {t(`${M}.remaining`, { defaultValue: 'Remaining:' })} {daysLeft} {t(`${M}.dayUnit`, { count: daysLeft })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-12">
          <button
            className="h-[35px] w-[170px] rounded-[7px] bg-lightGray border border-[rgba(0,0,0,0.1)] text-[#333] dark:text-white dark:bg-zinc-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            {t(`${M}.keepBook`, { defaultValue: 'Keep the book' })}
          </button>
          <button
            disabled={loading}
            className="h-[35px] w-[170px] rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors disabled:opacity-60 shadow"
            onClick={handleReturn}
          >
            {loading
              ? t(`${M}.returning`, { defaultValue: 'Returning...' })
              : t(`${M}.returnBook`, { defaultValue: 'Return the book' })}
          </button>
        </div>
      </div>
    </div>
  );
}
