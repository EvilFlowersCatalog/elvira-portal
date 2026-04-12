import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import DetailModal from "../../../modals/DetailModal";
import Calendar from "../../../inputs/Calendar";
import { IEntryDetail } from "../../../../utils/interfaces/entry";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";
import { CircleLoader } from "react-spinners";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { formatDate } from "date-fns";
import { FaRegCalendarXmark, FaRegCalendarPlus } from "react-icons/fa6";
import { IAvailabilityResponse } from "../../../../utils/interfaces/license";
import useGetAvailability from "../../../../hooks/api/licenses/useGetAvailability";
import useCreateLicense from "../../../../hooks/api/licenses/useCreateLicense";
import useDownloadLicense from "../../../../hooks/api/licenses/useDownloadLicense";
import { toast } from "react-toastify";
import Button from "../../../buttons/Button";
import { NAVIGATION_PATHS } from "../../../../utils/interfaces/general/general";

// http://localhost:3000/?licensing-entry-id=ce40e042-1491-434f-a0b4-593c0a867b99

export default function LicenseCalendar({}: {}) {
  const { t, i18n } = useTranslation();
  const { auth } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const getEntryDetail = useGetEntryDetail();
  const getAvailability = useGetAvailability();
  const createLicense = useCreateLicense();
  const { openInThorium, downloadDirect } = useDownloadLicense();
  const navigate = useNavigate();

  const [entryId, setEntryId] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [entry, setEntry] = useState<IEntryDetail | null>(null);

  const [selectionDayStart, setSelectionDayStart] = useState<Date | null>(null);
  const [selectionDayEnd, setSelectionDayEnd] = useState<Date | null>(null);

  const formatLocalizedDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  function onSelectionChange(start: Date | null, end: Date | null) {
    setSelectionDayStart(start);
    setSelectionDayEnd(end);
  }

  const [availability, setAvailability] =
    useState<IAvailabilityResponse | null>(null);

  useEffect(() => {
    const paramEntryId = searchParams.get("licensing-entry-id");
    const paramCatalogId = searchParams.get("licensing-catalog-id");
    setEntryId(paramEntryId);
    setCatalogId(paramCatalogId);
    setAvailability(null);
  }, [searchParams]);

  function requestAvailability(start: Date, end: Date) {
    if (!entryId) return;

    (async () => {
      try {
        const availabilityData = await getAvailability(start, end, entryId);
        setAvailability((prev: IAvailabilityResponse | null) => {
          if (prev == null) return availabilityData;
          return {
            ...prev,
            available: availabilityData.available,
            calendar: [...prev.calendar, ...availabilityData.calendar],
          } as IAvailabilityResponse;
        });
      } catch {
        setAvailability(null);
      }
    })();
  }

  async function lendBook() {
    if (!selectionDayStart || !entryId) return;

    if (!selectionDayEnd) return;
    const durationMs = selectionDayEnd.getTime() - selectionDayStart.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
    const license = await createLicense({
      entry_id: entryId,
      state: "active",
      starts_at: formatDate(selectionDayStart, "yyyy-MM-dd"),
      duration: `P${durationDays}D`,
    }).catch(() => {
      toast.error(t("notifications.license.create.error"));
      return;
    });
    if(!license) {
        toast.error(t("notifications.license.create.error"));
        return;
    }
    
    const licenseId = license!.lcp_license_id || license!.id;
    openInThorium(licenseId);

    closeCalendar();
    toast.success(
      <div className="flex flex-col gap-1">
        <span>{t("notifications.license.create.success")}</span>
        <button className="text-xs underline text-left" onClick={() => downloadDirect(licenseId)}>
          {t("notifications.license.download.fallback", { defaultValue: "Not opening in Thorium? Download file directly" })}
        </button>
      </div>,
      { autoClose: 8000 }
    );
    // const params = new URLSearchParams();
    // params.set("entry-detail-id", entryId);
    // if (entry?.catalog_id) {
    //   params.set("entry-catalog-id", entry.catalog_id);
    // }
    // navigate({
    //   pathname: NAVIGATION_PATHS.loans,
    //   search: params.toString(),
    // });
  }

  useEffect(() => {
    // Reset
    setEntry(null);
    if (!entryId) return;

    (async () => {
      try {
        const entryDetail = await getEntryDetail(
          entryId,
          catalogId || undefined,
        );
        setEntry(entryDetail);
      } catch {
        setEntry(null);
        closeCalendar();
      }
    })();
  }, [entryId]);

  function closeCalendar() {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("licensing-entry-id");
      newParams.delete("licensing-catalog-id");
      return newParams;
    });
    setEntryId(null);
    setCatalogId(null);
  }

  return (
    <DetailModal
      title={t("license.calendar.title")}
      onClose={closeCalendar}
      isOpen={!!entryId}
      zIndex={50}
    >
      <div className="p-3 mdlg:p-5 overflow-auto h-full min-h-0 flex flex-col gap-4 relative">
        {entry ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 h-full min-h-0 items-stretch relative">
            {/* Calendar */}
            <div className="order-2 lg:order-1 min-h-[22rem] lg:min-h-0 h-full max-h-full min-w-0 relative">
              {availability == null || availability?.available ? (
                <div className="h-full max-h-full min-h-0 min-w-0">
                  <Calendar
                    onSelectionChanged={onSelectionChange}
                    availability={availability}
                    requestAvailability={requestAvailability}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-full bg-red/5 dark:bg-red/10 border border-red/20 dark:border-red/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-red font-medium">
                      {t("license.calendar.noAvailability")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: book + dates + action */}
            <div className="order-1 lg:order-2 w-full min-w-0 flex flex-col gap-3 relative pb-6 lg:pb-0">
              <div className="flex gap-3 min-w-0 pb-3 border-b border-lightGray dark:border-strongDarkGray">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <div className="flex items-center gap-2 border border-lightGray dark:border-strongDarkGray rounded-md p-2">
                  <FaRegCalendarPlus
                    className="text-primary dark:text-primaryLight flex-shrink-0"
                    size={14}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-darkGray dark:text-lightGray opacity-70">
                      {t("license.calendar.from", { defaultValue: "From" })}
                    </p>
                    <p className="text-sm font-semibold text-secondary dark:text-secondaryLight truncate">
                      {formatLocalizedDate(selectionDayStart)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border border-lightGray dark:border-strongDarkGray rounded-md p-2">
                  <FaRegCalendarXmark
                    className="text-primary dark:text-primaryLight flex-shrink-0"
                    size={14}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-darkGray dark:text-lightGray opacity-70">
                      {t("license.calendar.to", { defaultValue: "To" })}
                    </p>
                    <p className="text-sm font-semibold text-secondary dark:text-secondaryLight truncate">
                      {formatLocalizedDate(selectionDayEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {selectionDayStart && selectionDayEnd && (
                <p className="text-xs text-darkGray dark:text-lightGray">
                  {t("license.calendar.duration", { defaultValue: "Duration" })}
                  :{" "}
                  {Math.ceil(
                    (selectionDayEnd.getTime() - selectionDayStart.getTime()) /
                      (1000 * 60 * 60 * 24),
                  ) + 1}{" "}
                  {t("license.calendar.days", { defaultValue: "days" })}
                </p>
              )}

              {selectionDayStart && selectionDayEnd && (
                <Button onClick={lendBook} className="w-full">
                  {t("license.calendar.lend")}
                </Button>
              )}
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
