import { BiBookAdd, BiBookAlt, BiBookOpen, BiCalendar } from "react-icons/bi";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import PDFButton from "./PDFButtons";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { IAvailabilityResponse, ILicense } from "../../utils/interfaces/license";
import { useSearchParams } from "react-router-dom";
import useGetLicenses from "../../hooks/api/licenses/useGetLicenses";

export default function AcquisitionsButton({ entry, acquisitions, availability }: { entry: IEntryDetail, acquisitions: IEntryAcquisition[], availability: IAvailabilityResponse | null }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const getUserLicenses = useGetLicenses();
    const [activeLicense, setActiveLicense] = useState<ILicense | undefined | null>(null);

    useEffect(() => {
        getUserLicenses({}).then(existingLicenses => {
            const foundLicense = existingLicenses.items.find(license => license.entry_id === entry.id && ['active', 'ready'].includes(license.state));
            setActiveLicense(foundLicense);
        });
    }, []);

    if (acquisitions.length === 0 && !availability?.available) return null;

    if (acquisitions.length === 1 && !availability?.available) {
        return (
            <PDFButton
                acquisition={acquisitions[0]}
                entryId={entry.id}>
                <div className={ActionButtonStyle}>
                    <BiBookOpen size={24} />{t('entry.detail.read')}
                </div>
            </PDFButton>
        );
    }

    function openBorrowModal() {
        const params = new URLSearchParams(searchParams);
        params.set('licensing-entry-id', entry.id);
        setSearchParams(params);
    }

    if (acquisitions.length === 0 && availability?.available && activeLicense == null) {
        return (
            <div>
                <div className={twMerge(ActionButtonStyle, 'w-full cursor-pointer')}
                    onClick={openBorrowModal}
                >
                    <BiCalendar className="flex-shrink-0" size={24} /> {t('entry.detail.borrow')}
                </div>
            </div>
        )
    }

    if( acquisitions.length === 0 && activeLicense != null) {
        return (
            <div className={twMerge(ActionButtonStyle, 'w-full cursor-pointer')}>
                <BiBookAlt className="flex-shrink-0" size={24} /> {t('entry.detail.activeLicense')}
            </div>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div
                className={twMerge(ActionButtonStyle, 'cursor-pointer')}
                onClick={() => setIsOpen(!isOpen)}
            >
                <BiBookAdd size={24} />{t('entry.detail.more')}
            </div>

            <div
                className={twMerge(
                    "absolute bottom-full left-0 w-full flex-col gap-2 p-1 transition-opacity duration-200 bg-lightGray dark:bg-gray rounded-lg shadow-lg",
                    isOpen ? "flex opacity-100" : "hidden opacity-0"
                )}
                style={{ zIndex: 10 }}
            >
                {acquisitions.map((acquisition, index) => (
                    <PDFButton
                        key={index}
                        acquisition={acquisition}
                        entryId={entry.id}>
                        <div className={twMerge(ActionButtonStyle, 'w-full')}>
                            <BiBookOpen size={24} /> {t('entry.detail.read')} {index + 1}
                        </div>
                    </PDFButton>
                ))}
                {availability?.available && activeLicense == null && (
                    <div
                        className={twMerge(ActionButtonStyle, 'w-full cursor-pointer')}
                        onClick={openBorrowModal}
                    >
                        <BiCalendar size={24} className="flex-shrink-0" /> {t('entry.detail.borrow')}
                    </div>
                )}
                {availability?.available && activeLicense != null && (
                    <div className={twMerge(ActionButtonStyle, 'w-full cursor-pointer')}>
                        <BiBookAlt size={24} className="flex-shrink-0" /> {t('entry.detail.activeLicense')}
                    </div>
                )}
            </div>
        </div>
    );
}
