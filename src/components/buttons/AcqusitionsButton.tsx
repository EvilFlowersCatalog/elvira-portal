import {
  BiBookAdd,
  BiBookOpen,
  BiCalendar,
  BiDownload,
} from "react-icons/bi";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import PDFButton from "./PDFButtons";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import useDownloadLicense from "../../hooks/api/licenses/useDownloadLicense";
import { toast } from "react-toastify";

export default function AcquisitionsButton({
  entry,
  acquisitions,
}: {
  entry: IEntryDetail;
  acquisitions: IEntryAcquisition[];
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { openInThorium, downloadDirect } = useDownloadLicense();

  const lcpState = entry.lcp_state;
  const userLicenseId = entry.user_active_license_id ?? null;
  const lcpAvailable = lcpState != null && lcpState !== 'not_lcp';
  const canBorrow = lcpState === 'available_now';

  const openBorrowModal = () => {
    const params = new URLSearchParams(searchParams);
    params.set("licensing-entry-id", entry.id);
    if (entry.catalog_id) {
      params.set("licensing-catalog-id", entry.catalog_id);
    }
    setSearchParams(params);
  };

  const isExperimental = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';
  if (acquisitions.length === 0 && (!isExperimental || !lcpAvailable)) return null;

  const SinglePDFButton = () => (
    <PDFButton acquisition={acquisitions[0]} index={0} entryId={entry.id} catalogId={entry.catalog_id}>
      <div className={ActionButtonStyle}>
        <BiBookOpen size={24} />
        {t("entry.detail.read")}
      </div>
    </PDFButton>
  );

  const BorrowButton = () => (
    <div
      className={twMerge(ActionButtonStyle, "w-full cursor-pointer")}
      onClick={openBorrowModal}
    >
      <BiCalendar size={24} className="flex-shrink-0" />
      {t("entry.detail.borrow")}
    </div>
  );

  const ActiveLicenseButton = ({ licenseId }: { licenseId: string }) => (
    <div
      className={twMerge(ActionButtonStyle, "w-full cursor-pointer")}
      onClick={() => {
        openInThorium({ id: licenseId });
        toast.info(
          <div className="flex flex-col gap-1">
            <span>{t('notifications.license.download.thoriumOpened', { defaultValue: 'Opening in Thorium...' })}</span>
            <button className="text-xs underline text-left" onClick={() => downloadDirect({ id: licenseId })}>
              {t('notifications.license.download.fallback', { defaultValue: 'Not opening? Download file directly' })}
            </button>
          </div>,
          { autoClose: 8000 }
        );
      }}
    >
      <BiDownload size={24} className="flex-shrink-0" />
      {t("entry.detail.activeLicense")}
    </div>
  );

  const MultipleAcquisitionsDropdown = () => (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={twMerge(ActionButtonStyle, "cursor-pointer")}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <BiBookAdd size={24} />
        {t("entry.detail.more")}
      </div>
      <div
        className={twMerge(
          "absolute bottom-full left-0 w-full flex-col gap-2 p-1 transition-opacity duration-200 bg-lightGray dark:bg-darkGray rounded-lg shadow-lg",
          isOpen ? "flex opacity-100" : "hidden opacity-0"
        )}
        style={{ zIndex: 10 }}
      >
        {acquisitions.map((acq, i) => (
          <PDFButton key={i} index={i} acquisition={acq} entryId={entry.id} catalogId={entry.catalog_id}>
            <div className={twMerge(ActionButtonStyle, "w-full")}>
              <BiBookOpen size={24} />
              {t("entry.detail.read")} {i + 1}
            </div>
          </PDFButton>
        ))}
        {isExperimental && userLicenseId && <ActiveLicenseButton licenseId={userLicenseId} />}
        {isExperimental && !userLicenseId && canBorrow && <BorrowButton />}
      </div>
    </div>
  );

  if (acquisitions.length === 1 && !lcpAvailable) {
    return <SinglePDFButton />;
  }

  if (isExperimental && acquisitions.length === 0 && userLicenseId) {
    return <ActiveLicenseButton licenseId={userLicenseId} />;
  }

  if (isExperimental && acquisitions.length === 0 && canBorrow) {
    return <BorrowButton />;
  }

  return <MultipleAcquisitionsDropdown />;
}
