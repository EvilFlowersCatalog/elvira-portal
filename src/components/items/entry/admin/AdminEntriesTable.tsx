import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';

export default function AdminEntriesTable({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const { umamiTrack, stuBorder, stuBg } = useAppContext();

    return (
        <div>
            <div className='flex w-full'>
                <div className="flex w-full items-center border-b last:border-b-0 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <button
                        className={`flex w-full items-center gap-2 px-4 py-2 rounded-md border-2 border-dashed ${stuBorder} ${stuBg} bg-opacity-40 hover:bg-opacity-20 duration-200`}
                        onClick={() => {
                            umamiTrack('Add Entry Button');
                            navigate(NAVIGATION_PATHS.adminAddEntries);
                        }}
                    >
                        <MdAdd size={24} className='text-black dark:text-white' />
                        <span className="font-medium">Add Entry</span>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full gap-2 px-3 pb-4'>
                {children}
            </div>
        </div>
    );
}
