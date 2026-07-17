import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';
import { FiCheckCircle } from 'react-icons/fi';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { ILicense } from '../../utils/interfaces/license';
import { problemDetailMessage } from '../../utils/problemDetail';
import useRenewLicense from '../../hooks/api/licenses/useRenewLicense';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const M = 'license.loansPage.modals';

interface Props {
  license: ILicense;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExtendLoanModal({ license, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const renewLicense = useRenewLicense();
  const { auth } = useAuthContext();
  const { t } = useTranslation();
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const expiresAt = parseISO(license.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const newExpiry1Week = addDays(expiresAt, 7);
  const newExpiry2Weeks = addDays(expiresAt, 14);
  const newExpiry = selected === 1 ? newExpiry1Week : newExpiry2Weeks;

  // The server caps `requested_end` at now + max_renew_days and refuses anything
  // beyond it. Offering options past that bound just produces a 403 the user
  // can't interpret, so grey them out and say why.
  const policy = license.renew_policy;
  const renewUpperBound = policy ? addDays(new Date(), policy.max_renew_days) : null;
  const exceedsBound = (d: Date) => (renewUpperBound ? d > renewUpperBound : false);

  // A loan is under embargo until embargo_days after acquisition.
  const embargoUntil = policy ? addDays(parseISO(license.created_at), policy.embargo_days) : null;
  const underEmbargo = embargoUntil ? embargoUntil > new Date() : false;
  const capReached = license.renewals_remaining === 0;

  const handleExtend = async () => {
    setLoading(true);
    try {
      await renewLicense(license.id, newExpiry.toISOString());
      setSuccess(true);
      onSuccess();
    } catch (e) {
      // Surface the API's RFC 7807 `detail` — it explains *why* (embargo, queue,
      // window, cap). A generic retry message hides a policy refusal as an error.
      toast.error(problemDetailMessage(e, t(`${M}.extendFailed`, { defaultValue: 'Extension failed. Please try again.' })));
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
        aria-labelledby="extend-loan-title"
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

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 id="extend-loan-title" className="text-2xl font-bold text-secondary dark:text-secondaryLight text-center">
              {t(`${M}.extendSuccessTitle`, { defaultValue: 'Extension successful!' })}
            </h2>
            <FiCheckCircle size={66} className="text-[#008B19] my-2" />
            <div className="w-full bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center">
              {license.entry?.thumbnail ? (
                <img
                  src={`${license.entry.thumbnail}?access_token=${auth?.token}`}
                  alt={license.entry.title}
                  className="w-[55px] h-[78px] rounded-[5px] object-cover shrink-0"
                />
              ) : (
                <div className="w-[55px] h-[78px] rounded-[5px] bg-gray-300 shrink-0" />
              )}
              <div className="flex flex-col gap-2 min-w-0">
                <p className="font-semibold text-sm text-secondary dark:text-secondaryLight truncate">
                  {license.entry?.title || t(`${M}.unknownTitle`, { defaultValue: 'Unknown title' })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                    {t(`${M}.borrowedUntil`, { defaultValue: 'Borrowed until:' })} {format(newExpiry, 'd.M.yyyy')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                    {t(`${M}.remaining`, { defaultValue: 'Remaining:' })} {differenceInDays(newExpiry, new Date())}{' '}
                    {t(`${M}.dayUnit`, { count: differenceInDays(newExpiry, new Date()) })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 id="extend-loan-title" className="text-base font-bold text-secondary dark:text-secondaryLight text-center mb-4">
              {t(`${M}.extendTitle`, { defaultValue: 'Extend loan' })}
            </h2>

            {/* Book info card */}
            <div className="bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center mb-4">
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
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#175a97]">
                    {t(`${M}.borrowedUntil`, { defaultValue: 'Borrowed until:' })} {format(expiresAt, 'd. M. yyyy')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-[7px] ${daysLeft <= 1 ? 'bg-[#ffe5dd] border border-[#c30000] text-[#c30000]' : 'bg-[#fff4dd] border border-[#e5c97e] text-[#333]'}`}>
                    {t(`${M}.remaining`, { defaultValue: 'Remaining:' })} {daysLeft} {t(`${M}.dayUnit`, { count: daysLeft })}
                  </span>
                </div>
              </div>
            </div>

            {/* Duration selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-secondary dark:text-secondaryLight">
                  {t(`${M}.durationLabel`, { defaultValue: 'Extension period:' })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { val: 1 as const, label: t(`${M}.oneWeek`, { defaultValue: '1 week' }), target: newExpiry1Week },
                  { val: 2 as const, label: t(`${M}.twoWeeks`, { defaultValue: '2 weeks' }), target: newExpiry2Weeks },
                ].map((opt) => {
                  const disabled = exceedsBound(opt.target);
                  return (
                    <button
                      key={opt.val}
                      disabled={disabled}
                      title={disabled && policy ? t(`${M}.exceedsMaxWindow`, { days: policy.max_renew_days, defaultValue: 'Exceeds the maximum window of {{days}} days' }) : undefined}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                        disabled
                          ? 'bg-gray-100 dark:bg-zinc-800 border-[#e5e5e5] dark:border-zinc-700 opacity-50 cursor-not-allowed'
                          : selected === opt.val
                            ? 'bg-[#e6f3ff] border-[#0077cc]'
                            : 'bg-white dark:bg-zinc-700 border-[#e5e5e5] dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600'
                      }`}
                      onClick={() => !disabled && setSelected(opt.val)}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === opt.val && !disabled ? 'border-[#0077cc]' : 'border-gray-400'}`}>
                        {selected === opt.val && !disabled && <span className="w-2 h-2 rounded-full bg-[#0077cc]" />}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-secondary dark:text-secondaryLight">{opt.label}</p>
                        <p className="text-[11px] text-gray-500">
                          {disabled && policy
                            ? t(`${M}.unavailableExceedsWindow`, { days: policy.max_renew_days, defaultValue: 'Unavailable — exceeds the {{days}}-day window' })
                            : `${t(`${M}.borrowedUntil`, { defaultValue: 'Borrowed until:' })} ${format(opt.target, 'd.M.yyyy')}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Renewal rules, read from the server's published policy so this
                  copy can never drift from what `evaluate_renew` enforces. */}
              {policy && (
                <div className="mt-3 rounded-lg bg-[#f0f8ff] dark:bg-blue-900/20 px-3 py-2">
                  <p className="text-[11px] text-[#175a97] dark:text-blue-300 leading-relaxed">
                    {t(`${M}.renewalPolicy`, {
                      embargoDays: policy.embargo_days,
                      maxRenewDays: policy.max_renew_days,
                      defaultValue:
                        'A loan can be extended no sooner than {{embargoDays}} days after borrowing and by at most {{maxRenewDays}} days ahead. Extension is not possible when other users are waiting for the title.',
                    })}
                    {policy.max_renewals !== null &&
                      t(`${M}.maxRenewals`, { max: policy.max_renewals, defaultValue: ' Maximum number of renewals: {{max}}.' })}
                  </p>
                  {underEmbargo && embargoUntil && (
                    <p className="text-[11px] text-[#9f6c00] dark:text-yellow-400 mt-1 font-semibold">
                      {t(`${M}.embargoNotice`, { date: format(embargoUntil, 'd.M.yyyy'), defaultValue: 'This loan can be extended starting {{date}}.' })}
                    </p>
                  )}
                  {capReached && (
                    <p className="text-[11px] text-[#c30000] dark:text-red-400 mt-1 font-semibold">
                      {t(`${M}.capReachedNotice`, { defaultValue: 'You have reached the maximum number of renewals.' })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-12">
              <button
                className="h-[35px] w-[170px] rounded-[7px] bg-lightGray border border-[rgba(0,0,0,0.1)] text-[#333] dark:text-white dark:bg-zinc-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                onClick={onClose}
              >
                {t(`${M}.cancel`, { defaultValue: 'Cancel' })}
              </button>
              <button
                disabled={loading}
                className="h-[35px] w-[170px] rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors disabled:opacity-60 shadow"
                onClick={handleExtend}
              >
                {loading
                  ? t(`${M}.extending`, { defaultValue: 'Extending...' })
                  : t(`${M}.extend`, { defaultValue: 'Extend' })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
