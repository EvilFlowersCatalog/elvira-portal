import { IEntry } from '../../../../utils/interfaces/entry';
import PageLoading from '../../PageLoading';
import useDataPage from '../../../../hooks/useDataContext';
import AdminEntry from './AdminEntry';
import { useNavigate } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';

const AdminEntryContainer = () => {
  const { data, isLoading } = useDataPage();
  const navigate = useNavigate();

  return (
    <div className='flex flex-col flex-1'>
      {data!.length === 0 && isLoading ? (
        <PageLoading />
      ) : (
        // ENTRIES
        <div className={`flex flex-wrap p-2.5`}>
          {/* Add button */}
          <div
            className={
              'flex p-2.5 w-full sm:w-1/2 md:w-1/3 lg:w-1/5 xl:w-1/6 xxl:w-[14.28%]'
            }
          >
            <button
              className={`flex flex-col justify-center min-h-72 dark:text-white text-black items-center p-2 w-full rounded-md border-4 border-dashed border-spacing-8 border-STUColor bg-STUColor bg-opacity-40 hover:bg-opacity-20 duration-200`}
              onClick={() => navigate(NAVIGATION_PATHS.adminAddEntries)}
            >
              <MdAdd size={50} />
            </button>
          </div>
          {data!.map((entry, index) => (
            <AdminEntry key={index} entry={entry as IEntry} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEntryContainer;
