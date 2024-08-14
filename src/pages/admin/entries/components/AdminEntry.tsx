import { MdDelete, MdEdit } from 'react-icons/md';
import { IEntry } from '../../../../utils/interfaces/entry.ts';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general.ts';
import useDeleteEntry from '../../../../hooks/api/entries/useDeleteEntry.tsx';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ConfirmationDialog from '../../../../components/dialogs/ConfirmationDialog.tsx';
import useAppContext from '../../../../hooks/contexts/useAppContext.tsx';
import useAuthContext from '../../../../hooks/contexts/useAuthContext.tsx';

interface IEntryParams {
  entry: IEntry;
  reload: () => void;
}

const AdminEntry = ({ entry, reload }: IEntryParams) => {
  const { auth } = useAuthContext();
  const { t } = useTranslation();
  const { showSearchBar, isSmallDevice } = useAppContext();
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const navigate = useNavigate();
  const deleteEntry = useDeleteEntry();

  // Handle delete button
  const handleDelete = async () => {
    try {
      // remove entry by id
      await deleteEntry(entry.id);
      toast.success(t('notifications.entry.remove.success')); // notify success
      reload();
    } catch {
      toast.error(t('notifications.entry.remove.error')); // notify error
    } finally {
      setShowDeleteMenu(false);
    }
  };

  return (
    <>
      {showDeleteMenu && (
        <ConfirmationDialog
          name={entry.title}
          close={setShowDeleteMenu}
          yes={handleDelete}
          type='entry'
        />
      )}
      <div
        className={`flex p-2.5 w-full sm:w-1/2 md:w-1/4 ${
          !isSmallDevice && showSearchBar
            ? 'lg:w-1/3 xl:w-1/4 xxl:w-1/6'
            : 'xl:w-1/5 xxl:w-[14.28%]'
        }`}
      >
        <div
          className={`flex flex-col justify-center p-2 w-full gap-2 rounded-md text-left bg-zinc-100 dark:bg-darkGray`}
        >
          <div
            className={`w-full ${
              imageLoaded ? 'h-auto' : 'h-64'
            } rounded-md border border-gray overflow-hidden`}
          >
            <img
              className={`w-full h-full duration-1000`}
              src={entry.thumbnail + `?access_token=${auth?.token}`}
              alt='Entry Thumbnail'
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <span
            className={`text-sm font-bold line-clamp-3 md:line-clamp-2 text-black dark:text-white`}
          >
            {entry.title}
          </span>
          <span className={'flex-1'}></span>
          {entry.authors.length > 0 && (
            <span className={`text-xs text-zinc-400 `}>
              {entry.authors[0].name} {entry.authors[0].surname}
            </span>
          )}
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
