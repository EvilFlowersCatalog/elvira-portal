import { MdDelete, MdEdit } from 'react-icons/md';
import { IEntry } from '../../../utils/interfaces/entry';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useDeleteEntry from '../../../hooks/api/entries/useDeleteEntry';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ModalWrapper from '../../modal/ModalWrapper';
import ConfirmationDialog from '../../dialogs/ConfirmationDialog';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface IEntryParams {
  entry: IEntry;
}

const AdminEntry = ({ entry }: IEntryParams) => {
  const { showSearchBar } = useAppContext();
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteEntry = useDeleteEntry();

  // Handle delete button
  const handleDelete = async () => {
    try {
      // remove entry by id
      await deleteEntry(entry.id);
      toast.success(t('notifications.entry.remove.success')); // notify success
    } catch {
      toast.error(t('notifications.entry.remove.error')); // notify error
    }
  };

  return (
    <>
      {showDeleteMenu && (
        <ConfirmationDialog
          name={entry.title}
          setOpen={setShowDeleteMenu}
          handleDelete={handleDelete}
        />
      )}
      <div
        className={`flex p-2.5 w-full sm:w-1/2 md:w-1/4 ${
          showSearchBar
            ? 'lg:w-1/3 xl:w-1/4 xxl:w-1/6'
            : 'xl:w-1/5 xxl:w-[14.28%]'
        }`}
      >
        <div
          className={`flex flex-col justify-center p-2 w-full gap-2 rounded-md text-left bg-zinc-100 dark:bg-darkGray`}
        >
          <div
            className={
              'w-full h-auto rounded-md border border-gray overflow-hidden'
            }
          >
            <img
              className={`w-full h-full duration-1000`}
              src={entry.thumbnail}
            />
          </div>
          <span
            className={`text-sm font-bold line-clamp-3 md:line-clamp-2 text-black dark:text-white`}
          >
            {entry.title}
          </span>
          <span className={'flex-1'}></span>
          <span className={`text-xs text-zinc-400 `}>
            {entry.authors[0].name} {entry.authors[0].surname}
          </span>
          <div className='flex gap-2'>
            <button
              className='flex flex-1 justify-center py-2 bg-green text-white rounded-md hover:bg-zinc-100 dark:hover:bg-darkGray hover:text-green duration-200'
              onClick={() =>
                navigate(NAVIGATION_PATHS.adminEditEntries + entry.id)
              }
            >
              <MdEdit size={20} />
            </button>
            <button
              className='flex flex-1 justify-center py-2 bg-red text-white rounded-md hover:bg-zinc-100 dark:hover:bg-darkGray hover:text-red duration-200'
              onClick={() => setShowDeleteMenu(true)}
            >
              <MdDelete size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminEntry;
