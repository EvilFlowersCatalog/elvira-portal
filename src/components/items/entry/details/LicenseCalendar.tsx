import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDays, differenceInCalendarDays, formatDate, startOfDay } from "date-fns";
import { CircleLoader } from "react-spinners";
import { toast } from "react-toastify";
import DetailModal from "../../../modals/DetailModal";
import { IEntryDetail } from "../../../../utils/interfaces/entry";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { IAvailabilityResponse, ILicense } from "../../../../utils/interfaces/license";
import useGetAvailability from "../../../../hooks/api/licenses/useGetAvailability";
import useCreateLicense from "../../../../hooks/api/licenses/useCreateLicense";
import useDownloadLicense from "../../../../hooks/api/licenses/useDownloadLicense";
import useGetLicenses from "../../../../hooks/api/licenses/useGetLicenses";
import Button from "../../../buttons/Button";
import { NAVIGATION_PATHS } from "../../../../utils/interfaces/general/general";

const WINDOW_DAYS = 7;
const LOOKAHEAD_DAYS = 60;

const findNextAvailableWindow = (
  calendar: IAvailabilityResponse["calendar"],
  startDate: Date,
  windowDays: number,
  lookaheadDays: number,
) => {
  const availabilityByDate = new Map<string, boolean>();
  calendar.forEach((slot) => availabilityByDate.set(slot.date, slot.is_available));

  for (let offset = 0; offset <= lookaheadDays - windowDays; offset += 1) {
    const windowStart = addDays(startDate, offset);
    let isAvailable = true;

    for (let dayOffset = 0; dayOffset < windowDays; dayOffset += 1) {
      const day = addDays(windowStart, dayOffset);
      const key = formatDate(day, "yyyy-MM-dd");
      if (availabilityByDate.get(key) !== true) {
        isAvailable = false;
        break;
      }
    }

    if (isAvailable) {
      return {
        start: windowStart,
        end: addDays(windowStart, windowDays - 1),
      };
    }
  }

  return null;
};

export default function LicenseCalendar({}: {}) {
  const { t, i18n } = useTranslation();
  const { auth } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const getEntryDetail = useGetEntryDetail();
  const getAvailability = useGetAvailability();
  const createLicense = useCreateLicense();
  const getUserLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();
  const navigate = useNavigate();

  const [entryId, setEntryId] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [activeLicense, setActiveLicense] = useState<ILicense | null>(null);
  const [nextWindow, setNextWindow] = useState<{ start: Date; end: Date } | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isCreatingLicense, setIsCreatingLicense] = useState(false);

  const formatLocalizedDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language || undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

  useEffect(() => {
    const paramEntryId = searchParams.get("licensing-entry-id");
    const paramCatalogId = searchParams.get("licensing-catalog-id");
    setEntryId(paramEntryId);
    setCatalogId(paramCatalogId);
    setNextWindow(null);
    setActiveLicense(null);
  }, [searchParams]);

  useEffect(() => {
    setEntry(null);
    if (!entryId) return;

    (async () => {
      try {
        const entryDetail = await getEntryDetail(entryId, catalogId || undefined);
        setEntry(entryDetail);
      } catch {
        setEntry(null);
        closeCalendar();
        return;
      }

      let hasActiveLicense = false;
      try {
        const licenses = await getUserLicenses({ pagination: false, entry_id: entryId });
        const found = licenses.items.find((l) => ["active", "ready"].includes(l.state));
        setActiveLicense(found || null);
        hasActiveLicense = Boolean(found);
      } catch {
        setActiveLicense(null);
      }

      if (hasActiveLicense) return;

      setIsLoadingAvailability(true);
      try {
        const today = startOfDay(new Date());
        const rangeEnd = addDays(today, LOOKAHEAD_DAYS);
        const availabilityData = await getAvailability(today, rangeEnd, entryId);
        setNextWindow(
          findNextAvailableWindow(
            availabilityData.calendar || [],
            today,
            WINDOW_DAYS,
            LOOKAHEAD_DAYS,
          ),
        );
      } catch {
        setNextWindow(null);
      } finally {
        setIsLoadingAvailability(false);
      }
    })();
  }, [entryId]);

  const closeCalendar = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("licensing-entry-id");
      newParams.delete("licensing-catalog-id");
      return newParams;
    });
    setEntryId(null);
    setCatalogId(null);
  };

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

  const lendBook = async () => {
    if (!entryId || !nextWindow) return;
    setIsCreatingLicense(true);

    try {
      await createLicense({
        entry_id: entryId,
        state: "active",
        starts_at: formatDate(nextWindow.start, "yyyy-MM-dd"),
        duration: `P${WINDOW_DAYS}D`,
      });
      toast.success(t("notifications.license.create.success"));
      closeCalendar();
      navigate(NAVIGATION_PATHS.loans);
    } catch {
      toast.error(t("notifications.license.create.error"));
    } finally {
      setIsCreatingLicense(false);
    }
  };

  const today = startOfDay(new Date());
  const daysUntilWindow = nextWindow
    ? differenceInCalendarDays(nextWindow.start, today)
    : null;

  return (
    <DetailModal
      title={t("license.queue.title", { defaultValue: "Borrow queue" })}
      onClose={closeCalendar}
      isOpen={!!entryId}
      zIndex={50}
    >
      <div className="p-4 mdlg:p-6 overflow-auto h-full min-h-0 flex flex-col gap-6 relative bg-slate-50 dark:bg-darkGray">
        {entry ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 h-full min-h-0 items-stretch relative">
            <div className="order-1 w-full min-w-0 flex flex-col gap-3 relative">
              <div className="flex gap-3 min-w-0 pb-4 border-b border-lightGray dark:border-strongDarkGray">
                <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={entry.thumbnail + `?access_token=${auth?.token}`}
                    alt={entry.title}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-secondary dark:text-secondaryLight line-clamp-2">
                    {entry.title}
                  </h2>

                  {entry.authors.length > 0 && (
                    <p className="mt-1 text-sm text-darkGray dark:text-lightGray truncate">
                      {entry.authors[0].name} {entry.authors[0].surname}
                      {entry.authors.length > 1
                        ? ` (+${entry.authors.length - 1} ${t("entry.detail.more")})`
                        : ""}
                    </p>
                  )}

                  {entry.publisher && (
                    <p className="mt-1 text-xs text-darkGray dark:text-lightGray opacity-75 truncate">
                      {t("entry.detail.publisher")}: {entry.publisher}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-lightGray dark:border-strongDarkGray bg-white dark:bg-strongDarkGray p-5 flex flex-col gap-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-primaryLight">
                  {t("license.queue.status", { defaultValue: "Queue status" })}
                </p>

                {activeLicense ? (
                  <>
                    <p className="text-sm text-darkGray dark:text-lightGray">
                      {t("license.queue.alreadyBorrowed", { defaultValue: "Already borrowed. Ready to download." })}
                    </p>
                    <Button onClick={() => downloadLoan(activeLicense)}>
                      {t("license.queue.download", { defaultValue: "Download loan" })}
                    </Button>
                  </>
                ) : isLoadingAvailability ? (
                  <div className="flex items-center gap-3 text-sm text-darkGray dark:text-lightGray">
                    <CircleLoader color={"var(--color-primary)"} size={22} />
                    {t("license.queue.loading", { defaultValue: "Checking availability..." })}
                  </div>
                ) : nextWindow ? (
                  <>
                    <p className="text-sm text-darkGray dark:text-lightGray">
                      {daysUntilWindow && daysUntilWindow > 0
                        ? t("license.queue.availableIn", {
                            defaultValue: "Available to lend in {{days}} days",
                            days: daysUntilWindow,
                          })
                        : t("license.queue.availableNow", { defaultValue: "Available to lend now" })}
                    </p>
                    <div className="inline-flex w-fit items-center rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-xs font-semibold text-primary dark:text-primaryLight">
                      {formatLocalizedDate(nextWindow.start)} - {formatLocalizedDate(nextWindow.end)}
                    </div>
                    {daysUntilWindow !== null && daysUntilWindow <= 0 && (
                      <Button
                        onClick={lendBook}
                        className={isCreatingLicense ? "opacity-70 cursor-not-allowed" : ""}
                        disabled={isCreatingLicense}
                      >
                        {t("license.queue.borrow", { defaultValue: "Borrow for 7 days" })}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-darkGray dark:text-lightGray">
                    {t("license.queue.noWindow", {
                      defaultValue: "No 7-day window in the next {{days}} days",
                      days: LOOKAHEAD_DAYS,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="order-2 w-full min-w-0 flex flex-col gap-3 relative">
              <div className="rounded-xl border border-lightGray dark:border-strongDarkGray bg-white dark:bg-strongDarkGray p-5 shadow-sm">
                <p className="text-sm text-darkGray dark:text-lightGray leading-relaxed">
                  {t("license.queue.note", {
                    defaultValue: "Loans are issued in 7-day windows. If the closest slot is in the future, wait until it opens to borrow.",
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <CircleLoader color={"var(--color-primary)"} size={50} />
          </div>
        )}
      </div>
    </DetailModal>
  );
}
