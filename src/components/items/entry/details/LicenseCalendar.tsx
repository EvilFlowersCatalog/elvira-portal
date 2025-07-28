import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Modal from "../../../dialogs/Modal";
import Calendar from "../../../inputs/Calendar";
import { IEntryDetail } from "../../../../utils/interfaces/entry";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";
import { CircleLoader } from "react-spinners";
import useAppContext from "../../../../hooks/contexts/useAppContext";
import { DetailHeader } from "./DetailHeader";

// http://localhost:3000/?licensing-entry-id=ce40e042-1491-434f-a0b4-593c0a867b99

export default function LicenseCalendar({ }: {}) {
    const { stuColor } = useAppContext();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const getEntryDetail = useGetEntryDetail();

    const [entryId, setEntryId] = useState<string | null>(null);
    const [entry, setEntry] = useState<IEntryDetail | null>(null);

    const [selectionDayStart, setSelectionDayStart] = useState<Date | null>(null);
    const [selectionDayEnd, setSelectionDayEnd] = useState<Date | null>(null);

    function onSelectionChange(start: Date, end: Date) {
        setSelectionDayStart(start);
        setSelectionDayEnd(end);
    }

    useEffect(() => {
        const paramEntryId = searchParams.get('licensing-entry-id');
        setEntryId(paramEntryId);
    }, [searchParams]);

    useEffect(() => {
        // Reset
        setEntry(null);
        if (!entryId) return;

        (async () => {
            try {
                const entryDetail = await getEntryDetail(entryId);
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
            newParams.delete('licensing-entry-id');
            return newParams;
        });
        setEntryId(null);
    }

    useEffect(() => {
        console.log('load entry')
        console.log(entry)
    }, [entryId]);

    return (
        <Modal
            title={t('license.calendar.title')}
            onClose={closeCalendar}
            isOpen={!!entryId}
            zIndex={50}
        >
            <div className="p-2 lg:p-8 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {entry ? (<>
                    <div className="flex mb-4 px-4 pt-2">
                        <DetailHeader entry={entry} feedsDisabled />
                        <div className="flex flex-col justify-center ml-8">
                            <span>
                                {selectionDayStart ? selectionDayStart.toLocaleDateString() : '-'}
                            </span>
                            <span>
                                 {selectionDayEnd ? selectionDayEnd.toLocaleDateString() : '-'}
                            </span>
                        </div>
                    </div>

                    <Calendar onSelectionChanged={onSelectionChange} bookedDates={[
                        '2025-07-30',
                        '2025-07-28',
                        '2025-07-27',
                        '2025-07-26',
                        '2025-07-25',
                    ]} />
                </>) : (
                    <div className={'flex justify-center h-full items-center'}>
                        <CircleLoader color={stuColor} size={50} />
                    </div>
                )}

            </div>
        </Modal>
    );
}