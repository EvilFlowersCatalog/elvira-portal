import { Checkbox, FormControlLabel } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoClose } from "react-icons/io5";

/**
 * Used for advanced search options in the search bar.
 */
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
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(()=>{
        setFilteredOptions(options);
        setShowMore(false); // Reset showMore when options change
    }, [options])

    const displayedOptions = showMore ? filteredOptions : filteredOptions.slice(0, 5);
    const remainingCount = filteredOptions.length - 5;

    return <div className="relative flex flex-col">
        <div className={`relative overflow-y-hidden`}>
            <div className="flex flex-col">
                <h2 className="text-[15px] capitalize font-bold mt-2 mb-1">{title}
                    {selected.length > 0 ? <span className="text-sm text-gray-400 ml-1">({selected.length})</span> : null}</h2>

                {enableSearch ?
                    <input className="dark:bg-strongDarkGray dark border-gray-300 dark:border-none rounded-md px-2 py-1 mb-2 placeholder:text-gray dark:placeholder:text-lightGray" placeholder={t('searchBar.search')}
                        onChange={(e) => {
                            const searchValue = e.target.value.toLowerCase();
                            if (!searchValue) {
                                setFilteredOptions(options);
                            } else {
                                setFilteredOptions(options.filter(option => option.label.toLowerCase().includes(searchValue)));
                            }
                            setShowMore(false); // Reset showMore when searching
                        }}
                    />
                    : null}

                {displayedOptions.map((option, index) => {
                    return <div key={option.value}>
                        <FormControlLabel sx={{
                            "& .MuiFormControlLabel-label": {
                                marginLeft: '0.5rem',
                                userSelect: 'none',
                            }
                        }} control={<Checkbox sx={{
                            "&.MuiCheckbox-root": {
                                'padding': '1px 0',
                                'marginLeft': '1rem',
                            },
                            ".dark & .MuiSvgIcon-root": {
                                color: 'white',
                            }
                        }}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelected([...selected, option.value]);
                                } else {
                                    setSelected(selected.filter(item => item !== option.value));
                                }
                            }}
                            checked={selected.includes(option.value)}
                            />}
                            label={option.label} />
                    </div>;
                })}
            </div>
        </div>
        
        {!showMore && filteredOptions.length > 5 && (
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMore(true);
                }}
                className="mt-2 text-center w-full font-semibold text-primary dark:text-primaryLight cursor-pointer select-none px-4 py-1 rounded whitespace-nowrap">
                {t('common.showMore', { count: remainingCount })}
            </div>
        )}
        
        {showMore && filteredOptions.length > 5 && (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMore(false);
                }}
                className="mt-2 flex gap-2 items-center justify-center w-full text-center font-semibold cursor-pointer select-none px-4 text-primary dark:text-primaryLight">
                <IoClose size={24} /> {t('common.showLess')}
            </div>
        )}
    </div>
}