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
  const { umamiTrack } = useAppContext();
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
          type="entry"
        />
      )}

      <div className="flex flex-col md:flex-row w-full rounded-2xl bg-white dark:bg-darkGray border border-border dark:border-zinc-700 hover:shadow-md transition-shadow duration-150 overflow-hidden">
        {/* Thumbnail */}
        <div className="w-full md:w-48 h-48 md:h-24 flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-700 bg-muted flex items-center justify-center">
          <img
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={entry.thumbnail + `?access_token=${auth?.token}`}
            alt="Entry Thumbnail"
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row flex-1 justify-between items-start px-4 py-4 gap-4">
          <div className="flex flex-col gap-1 w-full md:max-w-[70%]">
            <div className="text-base md:text-lg font-semibold text-black dark:text-white line-clamp-2">
              {entry.title}
            </div>
            {entry.authors.length > 0 && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {entry.authors[0].name} {entry.authors[0].surname}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              className="p-2 rounded-full hover:bg-green/20 transition-colors"
              onClick={() => {
              umamiTrack('Edit Entry Button', { entryId: entry.id });
              navigate(NAVIGATION_PATHS.adminEditEntries + entry.id);
              }}
            >
              <MdEdit size={24} className="text-green" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-red/20 transition-colors"
              onClick={() => {
              umamiTrack('Delete Entry Button', { entryId: entry.id });
              setShowDeleteMenu(true);
              }}
            >
              <MdDelete size={24} className="text-red" />
            </button>
          </div>
        </div>
      </div>

    </>
  );

};

export default AdminEntry;
