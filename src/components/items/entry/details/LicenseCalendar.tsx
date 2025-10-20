import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Modal from "../../../dialogs/Modal";
import Calendar from "../../../inputs/Calendar";
import { IEntryDetail } from "../../../../utils/interfaces/entry";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";
import { CircleLoader } from "react-spinners";
import useAppContext from "../../../../hooks/contexts/useAppContext";
import { DetailHeader } from "./DetailHeader";
import { formatDate } from "date-fns";
import { FaRegCalendarXmark, FaRegCalendarPlus } from "react-icons/fa6";
import { IAvailabilityResponse } from "../../../../utils/interfaces/license";
import useGetAvailability from "../../../../hooks/api/licenses/useGetAvailability";
import useCreateLicense from "../../../../hooks/api/licenses/useCreateLicense";
import { toast } from "react-toastify";
import Button from "../../../buttons/Button";
import { NAVIGATION_PATHS } from "../../../../utils/interfaces/general/general";

// http://localhost:3000/?licensing-entry-id=ce40e042-1491-434f-a0b4-593c0a867b99

export default function LicenseCalendar({ }: {}) {
    const { stuColor } = useAppContext();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const getEntryDetail = useGetEntryDetail();
    const getAvailability = useGetAvailability();
    const createLicense = useCreateLicense();
    const navigate = useNavigate();

    const [entryId, setEntryId] = useState<string | null>(null);
    const [entry, setEntry] = useState<IEntryDetail | null>(null);

    const [selectionDayStart, setSelectionDayStart] = useState<Date | null>(null);
    const [selectionDayEnd, setSelectionDayEnd] = useState<Date | null>(null);

    function onSelectionChange(start: Date | null, end: Date | null) {
        setSelectionDayStart(start);
        setSelectionDayEnd(end);
    }

    const [availability, setAvailability] = useState<IAvailabilityResponse | null>(null);

    useEffect(() => {
        const paramEntryId = searchParams.get('licensing-entry-id');
        setEntryId(paramEntryId);
        setAvailability(null);
    }, [searchParams]);

    function requestAvailability(start: Date, end: Date) {
        if (!entryId) return;

        (async () => {
            try {
                const availabilityData = await getAvailability(start, end, entryId);
                setAvailability((prev) => {
                    if (prev == null) return availabilityData;
                    prev.available = availabilityData.available;
                    prev.calendar = [...prev.calendar, ...availabilityData.calendar];
                    return prev;
                });
            } catch {
                setAvailability(null);
            }
        })();
    }

    function lendBook() {
        if (!selectionDayStart || !entryId) return;

        if (!selectionDayEnd) return;
        const durationMs = selectionDayEnd.getTime() - selectionDayStart.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
        createLicense({
            entry_id: entryId,
            state: 'active',
            starts_at: formatDate(selectionDayStart, 'yyyy-MM-dd'),
            duration: `P${durationDays}D`,
        }).then(() => {
            closeCalendar();
            toast.success(t('notifications.license.create.success'));
            const params = new URLSearchParams();
            params.set('entry-detail-id', entryId);
            navigate({
                pathname: NAVIGATION_PATHS.loans,
                search: params.toString(),
            });
        }).catch(() => {
            toast.error(t('notifications.license.create.error'));
        });
    }

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

    return (
        <Modal
            title={t('license.calendar.title')}
            onClose={closeCalendar}
            isOpen={!!entryId}
            zIndex={50}
        >
            <div className="p-2 lg:p-8 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {entry ? (<>
                    <div className="flex flex-col mb-4 px-4 pt-2">
                        <DetailHeader entry={entry} feedsDisabled />

                        {selectionDayStart ? <>
                            <div className="border rounded-lg mt-5 grid grid-cols-1 lg:grid-cols-2 justify-between">
                                <div className="p-4 flex gap-4">
                                    <FaRegCalendarPlus size={24} />
                                    <p>
                                        {selectionDayStart ? formatDate(selectionDayStart, 'dd.MM.yyyy') : '-'}
                                    </p>
                                </div>
                                <div className="p-4 flex gap-4 lg:border-l max-lg:border-t">
                                    <FaRegCalendarXmark size={24} />
                                    <p>
                                        {selectionDayEnd ? formatDate(selectionDayEnd, 'dd.MM.yyyy') : '-'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="mt-4"
                                onClick={lendBook}
                                disabled={!selectionDayStart || !selectionDayEnd}
                            >
                                {t('license.calendar.lend')}
                            </Button>
                        </> : null}
                    </div>

                    {/* The calendar will request availability for the selected date range */}
                    {availability == null || availability?.available ? (
                        <Calendar onSelectionChanged={onSelectionChange} availability={availability} requestAvailability={requestAvailability} />
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            {t('license.calendar.noAvailability')}
                        </div>
                    )}
                </>) : (
                    <div className={'flex justify-center h-full items-center'}>
                        <CircleLoader color={stuColor} size={50} />
                    </div>
                )}

            </div>
        </Modal >
    );
}