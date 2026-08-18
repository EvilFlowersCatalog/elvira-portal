import { BiBookOpen, BiCalendar, BiDownload } from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { LuRepeat2 } from "react-icons/lu";
import { MdOutlineKeyboardReturn } from "react-icons/md";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import useGetLicenses from "../../hooks/api/licenses/useGetLicenses";
import PDFButton from "./PDFButtons";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import { ILicense, LICENSE_STATE } from "../../utils/interfaces/license";
import useDownloadLicense from "../../hooks/api/licenses/useDownloadLicense";
import { toast } from "react-toastify";
import ExtendLoanModal from "../modals/ExtendLoanModal";
import ReturnBookModal from "../modals/ReturnBookModal";
import ReserveQueueModal from "../modals/ReserveQueueModal";

export default function AcquisitionsButton({
  entry,
  acquisitions,
  activeLicense: propActiveLicense,
  onRefresh,
}: {
  entry: IEntryDetail;
  acquisitions: IEntryAcquisition[];
  activeLicense?: ILicense | null;
  onRefresh?: () => void;
}) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const getUserLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();

  const [activeLicense, setActiveLicense] = useState<ILicense | null>(propActiveLicense ?? null);
  const [showExtend, setShowExtend] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  useEffect(() => {
    if (propActiveLicense !== undefined) {
      setActiveLicense(propActiveLicense);
      return;
    }
    // Skip the lookup when the entry already tells us there's no active or reserved license.
    if (!entry.user_active_license_id && !entry.user_reservation_id) {
      setActiveLicense(null);
      return;
    }
    getUserLicenses({ pagination: false, entry_id: entry.id }).then((res) => {
      const now = new Date();
      const found = res.items.find((l) => {
        const notExpired = !l.expires_at || new Date(l.expires_at) > now;
        if (l.state === LICENSE_STATE.active) return notExpired;
        return l.state === LICENSE_STATE.ready;
      });
      setActiveLicense(found || null);
    });
  }, [entry.id, propActiveLicense, entry.user_active_license_id, entry.user_reservation_id]);

  const openBorrowModal = () => {
    const params = new URLSearchParams(searchParams);
    params.set("licensing-entry-id", entry.id);
    if (entry.catalog_id) params.set("licensing-catalog-id", entry.catalog_id);
    setSearchParams(params);
  };

  const isReadiumEnabled = Boolean(entry.config?.readium_enabled);
  const hasAcquisitions = acquisitions.length > 0;
  // A `ready` licence is a granted-but-not-yet-started loan (the user claimed it
  // or it was just issued), NOT a queue reservation — this matches how
  // LoansCardView renders it in the "Borrowed" section. The real queue is the
  // separate Reservation model handled via `entry.user_reservation_id` below.
  // Treating `ready` as a reservation here previously contradicted the loans list.
  const isActiveLoan =
    (activeLicense?.state === LICENSE_STATE.active ||
      activeLicense?.state === LICENSE_STATE.ready) &&
    (!activeLicense?.expires_at || new Date(activeLicense.expires_at) > new Date());

  if (isActiveLoan && activeLicense) {
    return (
      <>
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            className={`${ActionButtonStyle} w-full cursor-pointer`}
            onClick={() => {
              const licenseRef = { id: activeLicense.lcp_license_id || activeLicense.id, download_url: activeLicense.download_url };
              openInThorium(licenseRef);
              toast.info(
                <div className="flex flex-col gap-1">
                  <span>{t('notifications.license.download.thoriumOpened', { defaultValue: 'Opening in Thorium...' })}</span>
                  <button className="text-xs underline text-left" onClick={() => downloadDirect(licenseRef)}>
                    {t('notifications.license.download.fallback', { defaultValue: 'Not opening? Download file directly' })}
                  </button>
                </div>,
                { autoClose: 8000 },
              );
            }}
          >
            <BiDownload size={24} className="flex-shrink-0" />
            {t("entry.detail.activeLicense")}
          </button>
          <div className="flex gap-2">
            <button
              className={`${ActionButtonStyle} flex-1 cursor-pointer`}
              onClick={() => setShowExtend(true)}
            >
              <LuRepeat2 size={20} className="flex-shrink-0" />
              {t('entry.detail.extend')}
            </button>
            <button
              className={`${ActionButtonStyle} flex-1 cursor-pointer`}
              onClick={() => setShowReturn(true)}
            >
              <MdOutlineKeyboardReturn size={20} className="flex-shrink-0" />
              {t('entry.detail.return')}
            </button>
          </div>
        </div>
        {showExtend && (
          <ExtendLoanModal
            license={activeLicense}
            onClose={() => setShowExtend(false)}
            onSuccess={() => { setShowExtend(false); onRefresh?.(); }}
          />
        )}
        {showReturn && (
          <ReturnBookModal
            license={activeLicense}
            onClose={() => setShowReturn(false)}
            onSuccess={() => { setActiveLicense(null); onRefresh?.(); }}
          />
        )}
      </>
    );
  }

  if (isReadiumEnabled) {
    // Already in the queue for this title (real Reservation, not a ready licence).
    // Links to the loans page where the reservation can be tracked or cancelled.
    if (entry.user_reservation_id) {
      return (
        <button
          type="button"
          className={`${ActionButtonStyle} w-full cursor-pointer`}
          onClick={() => navigate("/loans")}
        >
          <HiOutlineUsers size={24} className="flex-shrink-0" />
          {entry.user_position
            ? t("entry.detail.queuePosition", { position: entry.user_position, defaultValue: `In queue · #${entry.user_position}` })
            : t("entry.detail.reserved", { defaultValue: "Reserved" })}
        </button>
      );
    }

    // No slot free right now (`fully_borrowed`, or `available_in_days` while an
    // available reservation holds a virtual slot) -> the only action is to join
    // the queue; borrowing would just 409 ("no available slots").
    if (entry.lcp_state === "fully_borrowed" || entry.lcp_state === "available_in_days") {
      return (
        <>
          <button
            type="button"
            aria-label={t("entry.detail.reserve", { defaultValue: "Reserve" })}
            className={`${ActionButtonStyle} w-full cursor-pointer`}
            onClick={() => setShowReserve(true)}
          >
            <HiOutlineUsers size={24} className="flex-shrink-0" />
            {t("entry.detail.reserve", { defaultValue: "Reserve" })}
            {entry.queue_length ? ` (${entry.queue_length})` : ""}
          </button>
          {showReserve && (
            <ReserveQueueModal
              entry={entry}
              onClose={() => setShowReserve(false)}
              onSuccess={() => onRefresh?.()}
            />
          )}
        </>
      );
    }

    return (
      <button type="button" className={`${ActionButtonStyle} w-full cursor-pointer`} onClick={openBorrowModal}>
        <BiCalendar size={24} className="flex-shrink-0" />
        {t("entry.detail.borrow")}
      </button>
    );
  }

  if (hasAcquisitions) {
    return (
      <PDFButton acquisition={acquisitions[0]} index={0} entryId={entry.id} catalogId={entry.catalog_id}>
        <div className={ActionButtonStyle}>
          <BiBookOpen size={24} />
          {t("entry.detail.read")}
        </div>
      </PDFButton>
    );
  }

  return null;
}
