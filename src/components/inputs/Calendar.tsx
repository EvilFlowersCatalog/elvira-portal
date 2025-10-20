import React, { useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay, set } from "date-fns";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import { IAvailabilityResponse } from "../../utils/interfaces/license";

interface CalendarProps {
    availability: IAvailabilityResponse | null;
    requestAvailability: (start: Date, end: Date) => void;
    onSelectionChanged?: (start: Date | null, end: Date | null) => void;
}

const translation = {
    sk: {
        days: ['Ned', 'Pon', 'Uto', 'Str', 'Štv', 'Pia', 'Sob'],
        months: ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']
    },
    en: {
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
};

function isDateBooked(date: Date, availability: IAvailabilityResponse | null): boolean {
    if (!availability) return false;
    const formattedDate = format(date, "yyyy-MM-dd");
    return availability.calendar?.some(slot => slot.date === formattedDate && !slot.is_available);
}

const Calendar: React.FC<CalendarProps> = ({ availability, requestAvailability, onSelectionChanged }) => {
    const { i18n, t } = useTranslation();
    const lang = i18n.language as 'en' | 'sk';
    const weekDays = translation[lang].days;

    const [selectionDayStart, setSelectionDayStart] = React.useState<Date | null>(null);
    const [selectionDayEnd, setSelectionDayEnd] = React.useState<Date | null>(null);

    function validateSelection() {
        if (!onSelectionChanged) return;
        onSelectionChanged(null, null);
        if (!selectionDayEnd || !selectionDayStart) return;

        const start = selectionDayStart < selectionDayEnd ? selectionDayStart : selectionDayEnd;
        const end = selectionDayStart > selectionDayEnd ? selectionDayStart : selectionDayEnd;
        let day = new Date(start);
        let isPeriodBooked = false;

        while (day <= end) {
            isPeriodBooked = isDateBooked(day, availability);
            if (isPeriodBooked) break;
            day = addDays(day, 1);
        }

        if (isPeriodBooked) {
            setSelectionDayStart(null);
            setSelectionDayEnd(null);
            return toast.error(t('license.calendar.periodBooked'));
        }

        onSelectionChanged(selectionDayStart, selectionDayEnd);
    }

    useEffect(() => {
        if (selectionDayStart && selectionDayEnd) validateSelection();
    }, [selectionDayStart, selectionDayEnd]);

    function handleDayClick(stringDate: string) {
        const date = new Date(stringDate);
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return;
        if (selectionDayStart && selectionDayEnd) {
            onSelectionChanged?.(null, null);
            setSelectionDayStart(date);
            setSelectionDayEnd(null);
        } else if (selectionDayStart) {
            if (date < selectionDayStart) {
                setSelectionDayEnd(selectionDayStart);
                setSelectionDayStart(date);
            } else {
                setSelectionDayEnd(date);
            }
        } else {
            setSelectionDayStart(date);
            setSelectionDayEnd(null);
        }
    }
    
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [startDate, setStartDate] = React.useState<Date>(() => startOfWeek(startOfMonth(new Date())));
    const [endDate, setEndDate] = React.useState<Date>(() => endOfWeek(endOfMonth(new Date())));

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };


    useEffect(() => {
        setStartDate(startOfWeek(startOfMonth(currentDate)));
        setEndDate(endOfWeek(endOfMonth(currentDate)));
    }, [currentDate]);

    useEffect(() => {
        requestAvailability(startDate, endDate);
    }, [startDate, endDate]);

    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, "yyyy-MM-dd");

            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
            const isBooked = isDateBooked(day, availability);
            const isPreviousDayBooked = isDateBooked(addDays(day, -1), availability);
            const isNextDayBooked = isDateBooked(addDays(day, 1), availability);
            const isCurrentMonth = isSameMonth(day, currentDate);

            const isStartDate = selectionDayStart && isSameDay(day, format(selectionDayStart, "yyyy-MM-dd"));
            const isWithinSelection = selectionDayStart && selectionDayEnd && day >= selectionDayStart && day < selectionDayEnd;
            const isEndDate = selectionDayEnd && isSameDay(day, format(selectionDayEnd, "yyyy-MM-dd"));

            days.push(
                <div
                    key={day.getTime()}
                    data-key={formattedDate}
                    onClick={(event) => {
                        handleDayClick(event.currentTarget.getAttribute('data-key') || '');
                    }}
                    className={twMerge("group cursor-pointer aspect-square flex items-center justify-center transition-all rounded-lg",
                        `${isBooked ? 'bg-rose-400 dark:bg-pink-800' : 'bg-transparent hover:bg-primary/80'}`,
                        `${isCurrentMonth ? '' : 'opacity-40'}`,
                        `${isBooked && isNextDayBooked ? 'rounded-r-none' : ''}`,
                        `${isBooked && isPreviousDayBooked ? 'rounded-l-none' : ''}`,
                        `${isStartDate ? 'bg-blue-200 rounded-r-none' : ''}`,
                        `${isWithinSelection ? 'bg-blue-200 rounded-none' : ''}`,
                        `${isEndDate ? 'bg-blue-200 rounded-r-lg' : ''}`)}
                >
                    <div className={twMerge(`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold`,
                        `${isBooked ? 'text-black dark:text-white' : `text-black dark:text-white group-hover:text-white`}`,
                        `${isPast ? 'text-gray/50 dark:text-white/60' : ''}`,
                        `${isToday(day) ? `bg-blue-500 text-white dark:text-white group-hover:bg-white group-hover:text-black` : ''}`,
                        `${isWithinSelection || isStartDate ? 'dark:text-black' : ''}`)}>
                        {format(day, "d")}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
    }

    return (
        <div className="p-4 border rounded-2xl shadow-md bg-white dark:bg-zinc-800">
            <div className="flex justify-center items-center gap-4 mb-4">
                <FaChevronLeft className="cursor-pointer text-zinc-700 dark:text-zinc-300 hover:scale-110 transition" onClick={handlePrevMonth} />
                <h2 className="text-xl font-bold text-center text-zinc-800 dark:text-white">
                    {translation[lang].months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <FaChevronRight className="cursor-pointer text-zinc-700 dark:text-zinc-300 hover:scale-110 transition" onClick={handleNextMonth} />
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-300 mb-2">
                {weekDays.map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">{days}</div>
        </div>
    );
};

export default Calendar;
