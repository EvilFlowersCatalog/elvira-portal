import { useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { FiCheckCircle } from 'react-icons/fi';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { ILicense } from '../../utils/interfaces/license';
import { problemDetailMessage } from '../../utils/problemDetail';
import useRenewLicense from '../../hooks/api/licenses/useRenewLicense';
import useAuthContext from '../../hooks/contexts/useAuthContext';

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

  const expiresAt = parseISO(license.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const daysWord = daysLeft === 1 ? 'deň' : daysLeft >= 2 && daysLeft <= 4 ? 'dni' : 'dní';
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
      toast.error(problemDetailMessage(e, 'Predĺženie zlyhalo. Skúste to znova.'));
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

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-2xl font-bold text-secondary dark:text-secondaryLight text-center">
              Predĺženie úspešné!
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
                  {license.entry?.title || 'Neznámy titul'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                    Požičané do: {format(newExpiry, 'd.M.yyyy')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                    Zostáva: {differenceInDays(newExpiry, new Date())} dní
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-base font-bold text-secondary dark:text-secondaryLight text-center mb-4">
              Predĺženie výpožičky
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
                  {license.entry?.title || 'Neznámy titul'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-[7px] bg-[#cce6fe] border border-[#4c99e0] text-[#1e6cb4]">
                    Požičané do: {format(expiresAt, 'd. M. yyyy')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-[7px] ${daysLeft <= 1 ? 'bg-[#ffe5dd] border border-[#c30000] text-[#c30000]' : 'bg-[#fff4dd] border border-[#e5c97e] text-[#333]'}`}>
                    Zostáva: {daysLeft} {daysWord}
                  </span>
                </div>
              </div>
            </div>

            {/* Duration selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-secondary dark:text-secondaryLight">Doba predĺženia:</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { val: 1 as const, label: '1 týždeň', target: newExpiry1Week },
                  { val: 2 as const, label: '2 týždne', target: newExpiry2Weeks },
                ].map((opt) => {
                  const disabled = exceedsBound(opt.target);
                  return (
                    <button
                      key={opt.val}
                      disabled={disabled}
                      title={disabled && policy ? `Presahuje maximálne okno ${policy.max_renew_days} dní` : undefined}
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
                            ? `Nedostupné — presahuje ${policy.max_renew_days}-dňové okno`
                            : `Požičané do: ${format(opt.target, 'd.M.yyyy')}`}
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
                  <p className="text-[11px] text-[#1e6cb4] dark:text-blue-300 leading-relaxed">
                    Výpožičku možno predĺžiť najskôr {policy.embargo_days} dní po vypožičaní a
                    najviac o {policy.max_renew_days} dní dopredu. Predĺženie nie je možné, ak
                    na titul čakajú ďalší používatelia.
                    {policy.max_renewals !== null && ` Maximálny počet predĺžení: ${policy.max_renewals}.`}
                  </p>
                  {underEmbargo && embargoUntil && (
                    <p className="text-[11px] text-[#9f6c00] dark:text-yellow-400 mt-1 font-semibold">
                      Túto výpožičku bude možné predĺžiť až od {format(embargoUntil, 'd.M.yyyy')}.
                    </p>
                  )}
                  {capReached && (
                    <p className="text-[11px] text-[#c30000] dark:text-red-400 mt-1 font-semibold">
                      Dosiahli ste maximálny počet predĺžení.
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
                Zrušiť
              </button>
              <button
                disabled={loading}
                className="h-[35px] w-[170px] rounded-[7px] bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 shadow"
                onClick={handleExtend}
              >
                {loading ? 'Predlžujem...' : 'Predĺžiť'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
