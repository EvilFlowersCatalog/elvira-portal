import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoSearch } from "react-icons/io5";

export default function AdvancedCheckboxes({
    options,
    selected,
    setSelected,
    title,
    enableSearch = false
}: {
    options: { label: string; value: string }[];
    selected: string[];
    setSelected: (selected: string[]) => void;
    title?: string;
    enableSearch?: boolean;
}) {
    const { t } = useTranslation();
    const [showMore, setShowMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(() => {
        setFilteredOptions(options);
        setShowMore(false);
        setSearchQuery('');
    }, [options]);

    const displayedOptions = showMore ? filteredOptions : filteredOptions.slice(0, 5);
    const remainingCount = filteredOptions.length - 5;

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setFilteredOptions(
            value
                ? options.filter(o => o.label.toLowerCase().includes(value.toLowerCase()))
                : options
        );
        setShowMore(false);
    };

    const toggle = (value: string, checked: boolean) => {
        setSelected(checked ? [...selected, value] : selected.filter(v => v !== value));
    };

    return (
        <div className="flex flex-col gap-3">
            {title && (
                <p className="text-[14px] font-medium text-darkGray dark:text-white tracking-[0.1px]">
                    {title}
                    {selected.length > 0 && (
                        <span className="text-[13px] text-[#b1b1b1] ml-1">({selected.length})</span>
                    )}
                </p>
            )}

            {enableSearch && (
                <div className="relative">
                    <input
                        className="w-full bg-white dark:bg-strongDarkGray rounded-[4px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] px-2 py-[5px] pr-7 text-[11px] text-[#b1b1b1] placeholder:text-[#b1b1b1] focus:outline-none"
                        placeholder={t('searchBar.search')}
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                    />
                    <IoSearch size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b1b1b1]" />
                </div>
            )}

            <div className="flex flex-col gap-[7px]">
                {displayedOptions.map(option => (
                    <label
                        key={option.value}
                        className="flex items-center gap-[5px] cursor-pointer select-none"
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(option.value)}
                            onChange={e => toggle(option.value, e.target.checked)}
                            className="w-[18px] h-[18px] accent-primary cursor-pointer flex-shrink-0"
                        />
                        <span className={`text-[14px] tracking-[0.1px] leading-[20px] ${selected.includes(option.value) ? 'font-medium' : 'font-normal'} text-darkGray dark:text-white`}>
                            {option.label}
                        </span>
                    </label>
                ))}
            </div>

            {!showMore && remainingCount > 0 && (
                <button
                    onClick={() => setShowMore(true)}
                    className="text-[14px] font-medium text-primary text-center tracking-[0.1px] leading-[20px] cursor-pointer"
                >
                    {t('common.showMore', { count: remainingCount })}
                </button>
            )}

            {showMore && filteredOptions.length > 5 && (
                <button
                    onClick={() => setShowMore(false)}
                    className="text-[14px] font-medium text-primary text-center tracking-[0.1px] leading-[20px] cursor-pointer"
                >
                    {t('common.showLess')}
                </button>
            )}
        </div>
    );
}
