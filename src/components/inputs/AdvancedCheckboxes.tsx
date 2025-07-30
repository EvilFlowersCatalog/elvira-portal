import { Checkbox, FormControlLabel } from "@mui/material";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

/**
 * Used for advanced search options in the search bar.
 */
export default function AdvancedCheckboxes({
    options,
    selected,
    setSelected,
    title
}: {
    options: { label: string; value: string }[];
    selected: string[];
    setSelected: (selected: string[]) => void;
    title?: string;
}) {
    const [showMore, setShowMore] = useState(false);

    return <div className={`relative ${showMore ? 'max-h-auto' : 'max-h-[200px]'} h-full overflow-y-hidden`}>
        {!showMore && options.length > 5 ?
            <div className="absolute z-10 bottom-0 left-0 w-full">
                <div className="absolute bottom-0 left-0 w-full h-8 pointer-events-none bg-gradient-to-t from-lightGray dark:from-darkGray to-transparent z-2" />
                <div
                    onClick={() => setShowMore(true)}
                    className="absolute bottom-0 left-1/2 translate-x-[-50%] z-3 mx-auto w-fit font-semibold text-primary dark:text-primaryLight cursor-pointer select-none px-4 py-1 rounded whitespace-nowrap">
                    Show more
                </div>
            </div>
            : null
        }

        <div className="relative z-1 flex flex-col">
            <h2 className="text-lg capitalize mb-1 mt-2">{title}</h2>
            {options.map((option, index) => {
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
                    label={option.label} />} label={option.label} />
                </div>;
            })}
        </div>
        {showMore && options.length > 5 ?
            <div
                onClick={() => setShowMore(false)}
                className="relative flex gap-2 items-center justify-center w-full text-center font-semibold cursor-pointer select-none px-4 text-primary dark:text-primaryLight">
                <IoClose size={24} /> Show less
            </div>
            : null
        }
    </div >
}