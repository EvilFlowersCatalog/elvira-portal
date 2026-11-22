import React from "react";

export function ActionsWrapper({ children }: { children: React.ReactNode }) {
    // A lone last button (odd count after the full-width first row) spans the whole row.
    return <div className='grid grid-cols-2 gap-2 pt-2 pb-4 mt-auto mb-4 [&>*:last-child:nth-child(even)]:col-span-2'>
        {children}
    </div>
}

type ActionsButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
}

export const ActionButtonStyle = "w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex items-center justify-center gap-2 text-center leading-tight border-[1px] border-darkGray dark:border-lightGray bg-white dark:bg-strongDarkGray hover:border-transparent hover:dark:border-transparent hover:bg-primaryLight hover:text-primary hover:dark:bg-secondary hover:dark:text-primaryLight transition-colors duration-200"

export function ActionsButton({ children, onClick }: ActionsButtonProps) {
    return <button
        onClick={onClick}
        className={`${ActionButtonStyle} h-full`}>
        {children}
    </button>;
}