import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface CalendarProps {
    bookedDates?: string[];
}

var translation = {
    sk: {
        'days': ['Ned', 'Pon', 'Uto', 'Str', 'Štv', 'Pia', 'Sob'],
        'months': ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']
    },
    en: {
        'days': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    }
}

const Calendar: React.FC<CalendarProps> = ({ bookedDates = [] }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'en' | 'sk';
    const weekDays = translation[lang].days;

    const [currentDate, setCurrentDate] = React.useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(prev =>
            new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentDate(prev =>
            new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        );
    };

    const startDate = startOfWeek(startOfMonth(currentDate));
    const endDate = endOfWeek(endOfMonth(currentDate));

    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, "yyyy-MM-dd");
            const isBooked = bookedDates.includes(formattedDate);
            days.push(
                <div
                    key={day.getTime()}
                    className={`group cursor-pointer border min-h-20 flex flex-col justify-between shadow-sm transition-all 
                        ${isBooked ? 'bg-pink-200 dark:bg-pink-800' : 'bg-white dark:bg-darkGray hover:bg-primary/80'}
                        `}
                >
                    <div className={`text-sm text-center font-bold p-2
                        ${isBooked ? 'text-black dark:text-white' : 'text-black dark:text-white group-hover:text-white'}`}>{format(day, "d")}</div>
                </div>
            );
            day = addDays(day, 1);
        }
    }

    return (
        <div className="p-4">
            <div className="flex justify-center items-center gap-4 mb-4">
                <FaChevronLeft className="cursor-pointer" onClick={handlePrevMonth}></FaChevronLeft>
                <h2 className="text-xl font-bold text-center">
                    {translation[lang].months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <FaChevronRight className="cursor-pointer" onClick={handleNextMonth}></FaChevronRight>
            </div>
            <div className="grid grid-cols-7 justify-center mb-1">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 items-center gap-0 h-full">{days}</div>
        </div>
    );
};

export default Calendar;
