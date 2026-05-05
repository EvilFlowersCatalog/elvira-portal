import { BiBookOpen, BiCalendar, BiDownload } from "react-icons/bi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import useGetLicenses from "../../hooks/api/licenses/useGetLicenses";
import PDFButton from "./PDFButtons";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import { ILicense } from "../../utils/interfaces/license";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const getUserLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();

  const [activeLicense, setActiveLicense] = useState<ILicense | null>(null);

  useEffect(() => {
    getUserLicenses({pagination: false, entry_id: entry.id}).then((res) => {
      const now = new Date();
      const found = res.items.find((l) => {
        if (!["active", "ready"].includes(l.state)) return false;
        if (!l.expires_at) return true;
        return new Date(l.expires_at).getTime() > now.getTime();
      });
      setActiveLicense(found || null);
    });
  }, [entry.id]);

  const openBorrowModal = () => {
    const params = new URLSearchParams(searchParams);
    params.set("licensing-entry-id", entry.id);
    if (entry.catalog_id) {
      params.set("licensing-catalog-id", entry.catalog_id);
    }
    setSearchParams(params);
  };

  const isReadiumEnabled = Boolean(entry.config?.readium_enabled);
  const hasAcquisitions = acquisitions.length > 0;

  // === Subcomponents ===

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
      className={`${ActionButtonStyle} w-full cursor-pointer`}
      onClick={openBorrowModal}
    >
      <BiCalendar size={24} className="flex-shrink-0" />
      {t("entry.detail.borrow")}
    </div>
  );

  const ActiveLicenseButton = ({ lcp_license_id, id }: { lcp_license_id?: string; id: string }) => (
    <div
      className={`${ActionButtonStyle} w-full cursor-pointer`}
      onClick={() => {
        const licenseId = lcp_license_id || id;
        openInThorium(licenseId);
        toast.info(
          <div className="flex flex-col gap-1">
            <span>{t('notifications.license.download.thoriumOpened', { defaultValue: 'Opening in Thorium...' })}</span>
            <button className="text-xs underline text-left" onClick={() => downloadDirect(licenseId)}>
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

  if (activeLicense) {
    return <ActiveLicenseButton lcp_license_id={activeLicense.lcp_license_id} id={activeLicense.id} />;
  }

  if (isReadiumEnabled) {
    return <BorrowButton />;
  }

  if (hasAcquisitions) {
    return <SinglePDFButton />;
  }

  return null;
}
