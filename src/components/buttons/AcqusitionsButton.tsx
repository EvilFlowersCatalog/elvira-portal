import {
  BiBookAdd,
  BiBookAlt,
  BiBookOpen,
  BiCalendar,
} from "react-icons/bi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import useGetLicenses from "../../hooks/api/licenses/useGetLicenses";
import PDFButton from "./PDFButtons";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import { IAvailabilityResponse, ILicense } from "../../utils/interfaces/license";

export default function AcquisitionsButton({
  entry,
  acquisitions,
  availability,
}: {
  entry: IEntryDetail;
  acquisitions: IEntryAcquisition[];
  availability: IAvailabilityResponse | null;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const getUserLicenses = useGetLicenses();
  const [activeLicense, setActiveLicense] = useState<ILicense | null>(null);

  useEffect(() => {
    getUserLicenses({}).then((res) => {
      const found = res.items.find(
        (l) =>
          l.entry_id === entry.id && ["active", "ready"].includes(l.state)
      );
      setActiveLicense(found || null);
    });
  }, []);

  const openBorrowModal = () => {
    const params = new URLSearchParams(searchParams);
    params.set("licensing-entry-id", entry.id);
    setSearchParams(params);
  };

  // Early return if no relevant actions
  if (acquisitions.length === 0 && !availability?.available) return null;

  // === Subcomponents ===

  const SinglePDFButton = () => (
    <PDFButton acquisition={acquisitions[0]} entryId={entry.id}>
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

  const ActiveLicenseButton = () => (
    <div className={twMerge(ActionButtonStyle, "w-full cursor-pointer")}>
      <BiBookAlt size={24} className="flex-shrink-0" />
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
          "absolute bottom-full left-0 w-full flex-col gap-2 p-1 transition-opacity duration-200 bg-lightGray dark:bg-gray rounded-lg shadow-lg",
          isOpen ? "flex opacity-100" : "hidden opacity-0"
        )}
        style={{ zIndex: 10 }}
      >
        {acquisitions.map((acq, i) => (
          <PDFButton key={i} acquisition={acq} entryId={entry.id}>
            <div className={twMerge(ActionButtonStyle, "w-full")}>
              <BiBookOpen size={24} />
              {t("entry.detail.read")} {i + 1}
            </div>
          </PDFButton>
        ))}
        {availability?.available && !activeLicense && <BorrowButton />}
        {availability?.available && activeLicense && <ActiveLicenseButton />}
      </div>
    </div>
  );

  // === Render Decision Tree ===

  if (acquisitions.length === 1 && !availability?.available) {
    return <SinglePDFButton />;
  }

  if (acquisitions.length === 0 && availability?.available && !activeLicense) {
    return <BorrowButton />;
  }

  if (acquisitions.length === 0 && activeLicense) {
    return <ActiveLicenseButton />;
  }

  return <MultipleAcquisitionsDropdown />;
}
