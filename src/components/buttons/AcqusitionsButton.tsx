import { BiBookAdd, BiBookOpen } from "react-icons/bi";
import { IEntryAcquisition } from "../../utils/interfaces/acquisition";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { ActionButtonStyle } from "../items/entry/details/DetailActions";
import PDFButton from "./PDFButtons";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { useState} from "react";

export default function AcquisitionsButton({ entry, acquisitions }: { entry: IEntryDetail, acquisitions: IEntryAcquisition[] }) {

    // Todo get license, open calendar popup, etc.

    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    if (acquisitions.length === 0) return null;

    if (acquisitions.length === 1) {
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
                    "absolute bottom-full left-0 w-full flex-col gap-2 p-1 transition-opacity duration-200 bg-lightGray rounded-lg shadow-lg",
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
                            <BiBookOpen size={24} /> {t('entry.detail.read') } {index + 1}
                         </div>
                    </PDFButton>
                ))}
            </div>
        </div>
    );
}
