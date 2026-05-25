import { BiBookOpen, BiCalendar, BiDownload } from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { LuRepeat2 } from "react-icons/lu";
import { MdOutlineKeyboardReturn } from "react-icons/md";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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
import CancelReservationModal from "../modals/CancelReservationModal";

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
  const getUserLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();

  const [activeLicense, setActiveLicense] = useState<ILicense | null>(propActiveLicense ?? null);
  const [showExtend, setShowExtend] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    if (propActiveLicense !== undefined) {
      setActiveLicense(propActiveLicense);
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
  }, [entry.id, propActiveLicense]);

  const openBorrowModal = () => {
    const params = new URLSearchParams(searchParams);
    params.set("licensing-entry-id", entry.id);
    if (entry.catalog_id) params.set("licensing-catalog-id", entry.catalog_id);
    setSearchParams(params);
  };

  const isReadiumEnabled = Boolean(entry.config?.readium_enabled);
  const hasAcquisitions = acquisitions.length > 0;
  const isActiveLoan =
    activeLicense?.state === LICENSE_STATE.active &&
    (!activeLicense?.expires_at || new Date(activeLicense.expires_at) > new Date());
  const isReserved = activeLicense?.state === LICENSE_STATE.ready;

  if (isActiveLoan && activeLicense) {
    return (
      <>
        <div className="flex flex-col gap-2 w-full">
          <div
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
          </div>
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

  if (isReserved && activeLicense) {
    return (
      <>
        <button
          className={`${ActionButtonStyle} w-full cursor-pointer`}
          onClick={() => setShowCancel(true)}
        >
          <HiOutlineUsers size={24} className="flex-shrink-0" />
          {t('entry.detail.cancelReservation')}
        </button>
        {showCancel && (
          <CancelReservationModal
            license={activeLicense}
            onClose={() => setShowCancel(false)}
            onSuccess={() => { setActiveLicense(null); onRefresh?.(); }}
          />
        )}
      </>
    );
  }

  if (isReadiumEnabled) {
    return (
      <div className={`${ActionButtonStyle} w-full cursor-pointer`} onClick={openBorrowModal}>
        <BiCalendar size={24} className="flex-shrink-0" />
        {t("entry.detail.borrow")}
      </div>
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
