import { KeyboardEvent, MouseEvent, useEffect, useRef } from "react";
import { RiCloseLine } from "react-icons/ri";

/**
 * DetailModal - A large modal component for displaying detailed content
 * Used for: Entry details, licensing calendar, and other full-screen overlays
 * For form modals, use FormModal instead
 */
export default function DetailModal({ title, isOpen, onClose, zIndex, children }: { title: string, isOpen: boolean, onClose: () => void, zIndex: number, children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (ref.current) ref.current.focus();
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.code.toLowerCase() === 'escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        }
    };

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`fixed top-0 right-0 h-full w-full bg-black bg-opacity-60 flex items-center justify-center`} 
            style={{ zIndex }}
            onKeyDown={handleKeyDown}
            onClick={handleBackdropClick}
            tabIndex={-1}
            ref={ref}
        >
            <div 
                className='absolute bg-white dark:bg-strongDarkGray max-w-6xl rounded-xl w-full h-full max-h-[90vh] mdlg:overflow-hidden overflow-auto shadow-lg flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='w-full pl-8 pr-4 py-2 flex items-center border-b-[1px] border-lightGray dark:border-darkGray'>
                    <h2 className='text-secondary dark:text-secondaryLight text-lg font-bold'>
                        {title}
                    </h2>
                    <button
                        className={`text-black dark:text-white p-0 ml-auto`}
                        onClick={onClose}
                    >
                        <RiCloseLine size={32} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
