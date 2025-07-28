import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from "date-fns";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface CalendarProps {
    bookedDates?: string[];
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

const Calendar: React.FC<CalendarProps> = ({ bookedDates = [] }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'en' | 'sk';
    const weekDays = translation[lang].days;
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const startDate = startOfWeek(startOfMonth(currentDate));
    const endDate = endOfWeek(endOfMonth(currentDate));

    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, "yyyy-MM-dd");
            const isBooked = bookedDates.includes(formattedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);

            days.push(
                <div
                    key={day.getTime()}
                    className={`group cursor-pointer aspect-square flex items-center justify-center transition-all rounded-lg
                        ${isBooked ? 'bg-pink-200 dark:bg-pink-800' : 'bg-white dark:bg-zinc-900 hover:bg-primary/80'}
                        ${isCurrentMonth ? '' : 'opacity-40'}
                    `}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${isToday(day) ? 'bg-blue-500 text-white' : ''}
                        ${isBooked ? 'text-black dark:text-white' : 'text-black dark:text-white group-hover:text-white'}`}>
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
