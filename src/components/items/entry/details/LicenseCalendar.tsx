import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Modal from "../../../dialogs/Modal";
import Calendar from "../../../inputs/Calendar";

export default function LicenseCalendar({ }: {}) {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [entryId, setEntryId] = useState<string | null>(null);

    useEffect(() => {
        const paramEntryId = searchParams.get('licensing-entry-id');
        setEntryId(paramEntryId);
    }, [searchParams]);

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
    }, [entryId]);

    return (
        <Modal
            title={t('license.calendar.title')}
            onClose={closeCalendar}
            isOpen={!!entryId}
            zIndex={50}
        >
            <div className="pd-2 lg:p-8 overflow-auto">
                <div className="flex mb-4 px-4 pt-2">
                    <h2 className="text-lg font-bold">Entry details</h2>
                </div>

                <Calendar bookedDates={[
                    '2025-07-28',
                ]} />

            </div>
        </Modal>
    );
}