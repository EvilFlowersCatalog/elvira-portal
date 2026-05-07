import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { addDays, format } from "date-fns";
import { CircleLoader } from "react-spinners";
import { toast } from "react-toastify";
import { FiCheckCircle, FiEye, FiEyeOff, FiInfo } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import { RiArrowLeftLine, RiCloseLine } from "react-icons/ri";
import { BsQuestionCircle } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { IEntryDetail } from "../../../../utils/interfaces/entry";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { ILicense } from "../../../../utils/interfaces/license";
import useCreateLicense from "../../../../hooks/api/licenses/useCreateLicense";
import useDownloadLicense from "../../../../hooks/api/licenses/useDownloadLicense";
import Button from "../../../buttons/Button";

const PASSPHRASE_KEY = 'elvira-passphrase';

type View = 'main' | 'passphrase' | 'success';
type Duration = '1week' | '2weeks';

function mimeToFormat(mime: string): string {
  if (mime.includes('epub')) return 'EPUB';
  if (mime.includes('pdf')) return 'PDF';
  return mime.split('/').pop()?.toUpperCase() ?? 'EPUB';
}

export default function LicenseCalendar() {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getEntryDetail } = useGetEntryDetail();
  const createLicense = useCreateLicense();
  const { openInThorium, downloadDirect } = useDownloadLicense();

  const [entryId, setEntryId] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingLicense, setIsCreatingLicense] = useState(false);
  const [view, setView] = useState<View>('main');
  const [createdLicense, setCreatedLicense] = useState<ILicense | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>('1week');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [passphrase, setPassphrase] = useState('');
  const [passphraseHint, setPassphraseHint] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  useEffect(() => {
    const paramEntryId = searchParams.get("licensing-entry-id");
    const paramCatalogId = searchParams.get("licensing-catalog-id");
    setEntryId(paramEntryId);
    setCatalogId(paramCatalogId);
    setView('main');
    setCreatedLicense(null);
    setSelectedDuration('1week');
    setShowHowItWorks(false);
    setPassphrase('');
    setPassphraseHint('');
  }, [searchParams]);

  useEffect(() => {
    setEntry(null);
    if (!entryId) return;
    setIsLoading(true);
    getEntryDetail(entryId, catalogId || undefined)
      .then(setEntry)
      .catch(() => { setEntry(null); closeModal(); })
      .finally(() => setIsLoading(false));
  }, [entryId]);

  const closeModal = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("licensing-entry-id");
      p.delete("licensing-catalog-id");
      return p;
    });
  };

  const today = new Date();
  const endDate1Week = addDays(today, 7);
  const endDate2Weeks = addDays(today, 14);
  const selectedEndDate = selectedDuration === '1week' ? endDate1Week : endDate2Weeks;

  const downloadLoan = (license: ILicense) => {
    const licenseId = license.lcp_license_id || license.id;
    openInThorium(licenseId);
    toast.info(
      <div className="flex flex-col gap-1">
        <span>{t("notifications.license.download.thoriumOpened", { defaultValue: "Opening in Thorium..." })}</span>
        <button className="text-xs underline text-left" onClick={() => downloadDirect(licenseId)}>
          {t("notifications.license.download.fallback", { defaultValue: "Not opening? Download file directly" })}
        </button>
      </div>,
      { autoClose: 8000 },
    );
  };

  const doLendBook = async () => {
    if (!entryId) return;
    setIsCreatingLicense(true);
    try {
      const duration = selectedDuration === '1week' ? 'P7D' : 'P14D';
      const license = await createLicense({
        entry_id: entryId,
        state: "active",
        starts_at: format(today, "yyyy-MM-dd"),
        duration,
      });
      setCreatedLicense(license);
      setView('success');
    } catch {
      toast.error(t("notifications.license.create.error"));
    } finally {
      setIsCreatingLicense(false);
    }
  };

  const savePassphraseAndBorrow = () => {
    if (!passphrase.trim()) {
      toast.error('Zadajte prístupovú frázu.');
      return;
    }
    localStorage.setItem(PASSPHRASE_KEY, passphrase.trim());
    if (passphraseHint.trim()) {
      localStorage.setItem(`${PASSPHRASE_KEY}-hint`, passphraseHint.trim());
    }
    doLendBook();
  };

  const handleBorrow = () => {
    if (!localStorage.getItem(PASSPHRASE_KEY)) {
      setView('passphrase');
      return;
    }
    doLendBook();
  };

  const fileFormat = entry?.acquisitions?.[0]?.mime ? mimeToFormat(entry.acquisitions[0].mime) : 'EPUB';

  if (!entryId) return null;

  return (
    <div
      className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-lightGray dark:border-zinc-700 shrink-0">
          {view === 'passphrase' ? (
            <button
              className="text-secondary dark:text-secondaryLight p-1"
              onClick={() => setView('main')}
            >
              <RiArrowLeftLine size={20} />
            </button>
          ) : (
            <div className="w-7" />
          )}
          <h2 className="flex-1 text-center text-base font-bold text-secondary dark:text-secondaryLight">
            {view === 'passphrase'
              ? t('license.passphrase.title', { defaultValue: 'Nastavenie prístupovej frázy' })
              : view === 'success'
              ? t('license.success.title', { defaultValue: 'Výpožička úspešná!' })
              : t('license.borrow.title', { defaultValue: 'Výpožička knihy' })}
          </h2>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1" onClick={closeModal}>
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 p-6">
          {isLoading && (
            <div className="flex justify-center py-10">
              <CircleLoader color="var(--color-primary)" size={40} />
            </div>
          )}

          {/* ── MAIN VIEW ── */}
          {!isLoading && entry && view === 'main' && (
            <>
              {/* Book info card */}
              <div className="bg-lightGray dark:bg-zinc-700 rounded-[10px] p-4 flex gap-5 items-start">
                <div className="w-[73px] h-[103px] rounded-[5px] overflow-hidden shrink-0 bg-gray-200">
                  <img
                    className="w-full h-full object-cover"
                    src={entry.thumbnail + `?access_token=${auth?.token}`}
                    alt={entry.title}
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-0 flex-1 pt-1">
                  <p className="font-semibold text-base text-secondary dark:text-secondaryLight line-clamp-2 leading-snug">
                    {entry.title}
                  </p>
                  {entry.authors.length > 0 && (
                    <p className="text-sm text-darkGray dark:text-lightGray">
                      {entry.authors.map(a => `${a.name} ${a.surname}`).join(', ')}
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap mt-1">
                    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#008b19] shrink-0" />
                      {t('license.available', { defaultValue: 'Dostupné' })}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-[7px] border border-gray-300 dark:border-zinc-500 text-darkGray dark:text-lightGray">
                      {t('license.format', { defaultValue: 'Formát:' })} <strong>{fileFormat}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-secondary dark:text-secondaryLight">
                    {t('license.borrow.duration', { defaultValue: 'Doba výpožičky:' })}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('license.borrow.extendNote', { defaultValue: 'Výpožičku môžete neskôr predĺžiť.' })}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {([
                    { val: '1week' as Duration, label: t('license.borrow.oneWeek', { defaultValue: '1 týždeň' }), endDate: endDate1Week },
                    { val: '2weeks' as Duration, label: t('license.borrow.twoWeeks', { defaultValue: '2 týždne' }), endDate: endDate2Weeks },
                  ] as const).map((opt) => (
                    <button
                      key={opt.val}
                      className={`flex items-center gap-3 px-4 py-3 rounded-[7px] border text-left transition-colors ${
                        selectedDuration === opt.val
                          ? 'bg-[#e6f3ff] border-primary'
                          : 'bg-white dark:bg-zinc-700 border-[#e5e5e5] dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600'
                      }`}
                      onClick={() => setSelectedDuration(opt.val)}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedDuration === opt.val ? 'border-primary' : 'border-gray-400'
                      }`}>
                        {selectedDuration === opt.val && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-secondary dark:text-secondaryLight">{opt.label}</p>
                        <p className="text-[11px] text-gray-500">
                          {t('license.borrow.borrowedUntil', { defaultValue: 'Požičané do:' })} <strong>{format(opt.endDate, 'd.M.yyyy')}</strong>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* How it works accordion */}
              <button
                className="w-full flex items-center justify-between bg-lightGray dark:bg-zinc-700 px-3 py-2 rounded-[5px] text-sm"
                onClick={() => setShowHowItWorks(v => !v)}
              >
                <span className="flex items-center gap-2 font-semibold text-secondary dark:text-secondaryLight text-xs">
                  <BsQuestionCircle size={16} />
                  {t('license.howItWorks.label', { defaultValue: 'Ako to funguje?' })}
                </span>
                {showHowItWorks ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
              </button>
              {showHowItWorks && (
                <div className="bg-lightGray dark:bg-zinc-700 rounded-[5px] px-4 py-3 -mt-3 text-xs text-darkGray dark:text-lightGray flex flex-col gap-1.5">
                  <p>{t('license.howItWorks.step1', { defaultValue: 'Po požičaní dostanete odkaz na stiahnutie súboru.' })}</p>
                  <p>{t('license.howItWorks.step2', { defaultValue: 'Na čítanie odporúčame Thorium Reader (zadarmo, Windows/macOS/Linux).' })}</p>
                  <p>{t('license.howItWorks.step3', { defaultValue: 'Súbor je chránený prístupovou frázou – zadáte ju pri prvom otvorení.' })}</p>
                  <p>{t('license.howItWorks.step4', { defaultValue: 'Výpožičku môžete predĺžiť (max. 2×) alebo vrátiť kedykoľvek.' })}</p>
                </div>
              )}

              {/* Borrow button */}
              <div className="flex justify-center pt-2">
                <button
                  disabled={isCreatingLicense}
                  onClick={handleBorrow}
                  className="h-[35px] w-[150px] rounded-[7px] bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow"
                >
                  {isCreatingLicense ? '...' : t('license.borrow.action', { defaultValue: 'Požičať' })}
                </button>
              </div>
            </>
          )}

          {/* ── PASSPHRASE VIEW ── */}
          {!isLoading && view === 'passphrase' && (
            <div className="flex flex-col items-center gap-4 max-w-lg mx-auto w-full py-2">
              <p className="text-sm font-semibold text-secondary dark:text-secondaryLight text-center">
                {t('license.passphrase.description', { defaultValue: 'Pre vypožičanie knihy musíte nastaviť prístupovú frázu.' })}
              </p>
              <div className="w-full bg-lightGray dark:bg-zinc-700 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-secondary dark:text-secondaryLight">
                    {t('license.passphrase.field', { defaultValue: 'Prístupová fráza' })} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder={t('license.passphrase.field', { defaultValue: 'Prístupová fráza' })}
                      className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded px-3 py-2 text-sm outline-none focus:border-primary pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassphrase(v => !v)}
                    >
                      {showPassphrase ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-secondary dark:text-secondaryLight">
                    {t('license.passphrase.hint', { defaultValue: 'Nápoveda k prístupovej fráze' })}
                  </label>
                  <input
                    type="text"
                    value={passphraseHint}
                    onChange={(e) => setPassphraseHint(e.target.value)}
                    placeholder={t('license.passphrase.hintPlaceholder', { defaultValue: 'Nápoveda' })}
                    className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <FiInfo size={15} className="shrink-0 mt-0.5" />
                  <span>{t('license.passphrase.info', { defaultValue: 'Prístupová fráza slúži na odomknutie požičanej knihy.' })}</span>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  disabled={isCreatingLicense}
                  onClick={savePassphraseAndBorrow}
                  className="h-[35px] w-[150px] rounded-[7px] bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow"
                >
                  {isCreatingLicense ? '...' : t('license.passphrase.save', { defaultValue: 'Uložiť a požičať' })}
                </button>
              </div>
            </div>
          )}

          {/* ── SUCCESS VIEW ── */}
          {!isLoading && entry && view === 'success' && (
            <div className="flex flex-col items-center gap-5 max-w-xl mx-auto w-full py-2">
              <FiCheckCircle size={66} className="text-[#008B19]" />
              <div className="w-full bg-lightGray dark:bg-zinc-700 rounded-xl p-4 flex gap-3 items-center">
                <div className="w-[55px] h-[78px] rounded-[5px] overflow-hidden shrink-0 bg-gray-200">
                  <img
                    className="w-full h-full object-cover"
                    src={entry.thumbnail + `?access_token=${auth?.token}`}
                    alt={entry.title}
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="font-semibold text-sm text-secondary dark:text-secondaryLight line-clamp-2">
                    {entry.title}
                  </p>
                  {createdLicense?.expires_at && (
                    <span className="text-xs px-2 py-0.5 w-fit rounded-[7px] bg-[#cfffd8] border border-[#008b19] text-[#005e11]">
                      {t('license.success.borrowedUntil', { defaultValue: 'Požičané do:' })} {format(new Date(createdLicense.expires_at), 'd.M.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary dark:text-secondaryLight mb-2">
                  <FiInfo size={15} />
                  {t('license.success.nextSteps', { defaultValue: 'Ďalšie kroky:' })}
                </p>
                <ul className="list-disc ml-5 flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <li>{t('license.success.step1', { defaultValue: 'Bol vám vygenerovaný odkaz na stiahnutie súboru.' })}</li>
                  <li>
                    {t('license.success.step2prefix', { defaultValue: 'Na otvorenie súboru odporúčame' })}{' '}
                    <a href="https://thorium.edrlab.org/en/" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-secondary dark:text-secondaryLight">
                      Thorium Reader
                    </a>
                    {t('license.success.step2suffix', { defaultValue: ', ktorý je bezplatný a dostupný pre Windows, macOS aj Linux.' })}
                  </li>
                  <li>{t('license.success.step3', { defaultValue: 'Súbor je chránený prístupovou frázou — zadáte ju pri prvom otvorení v čítačke.' })}</li>
                  <li>{t('license.success.step4', { defaultValue: 'Na stránke výpožičiek môžete knihu predĺžiť (max. 2×) alebo ju kedykoľvek vrátiť.' })}</li>
                </ul>
              </div>
              {createdLicense && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => downloadLoan(createdLicense)}
                    className="h-[35px] px-6 rounded-[7px] bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow flex items-center gap-2"
                  >
                    <LuDownload size={16} />
                    {t('license.success.download', { defaultValue: 'Stiahnuť' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
