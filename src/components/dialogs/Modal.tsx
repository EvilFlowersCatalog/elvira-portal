import { RiCloseLine } from "react-icons/ri";
import useAppContext from "../../hooks/contexts/useAppContext";

export default function Modal({ title, isOpen, onClose, zIndex, children }: { title: string, isOpen: boolean, onClose: () => void, zIndex: number, children: React.ReactNode }) {
    if (!isOpen) return null;

    return (
        <div className={`fixed top-0 right-0 h-full w-full bg-black bg-opacity-60 flex items-center justify-center`} style={{ zIndex }}>
            <div className='absolute bg-white dark:bg-gray max-w-6xl rounded-xl w-full h-full max-h-[90vh] mdlg:overflow-hidden overflow-auto rounded-md shadow-lg flex flex-col'>
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