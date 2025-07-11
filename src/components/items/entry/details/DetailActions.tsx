import React from "react";

export function ActionsWrapper({ children }: { children: React.ReactNode }) {
    return <div className='grid grid-cols-2 gap-4 py-4 mt-auto mb-4'>
        {children}
    </div>
}

type ActionsButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
}

export const ActionButtonStyle = "w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex justify-start gap-4 border-[1px] border-darkGray dark:border-lightGray"

export function ActionsButton({ children, onClick }: ActionsButtonProps) {
    return <button
        onClick={onClick}
        className={ActionButtonStyle}>
        {children}
    </button>;
}