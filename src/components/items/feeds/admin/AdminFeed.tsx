import { MdDelete, MdEdit, MdFeed } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { FaCircleArrowRight, FaFolder, FaFolderOpen } from 'react-icons/fa6';
import { useState } from 'react';
import FeedForm from './FeedForm';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IFeed } from '../../../../utils/interfaces/feed';
import useDeleteFeed from '../../../../hooks/api/feeds/useDeleteFeed';
import ConfirmationDialog from '../../../dialogs/ConfirmationDialog';
import useAppContext from '../../../../hooks/contexts/useAppContext';

interface IFeedParams {
  feed: IFeed;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const AdminFeed = ({ feed, reloadPage, setReloadPage }: IFeedParams) => {
  const { t } = useTranslation();
  const { stuBgHover, stuBg, umamiTrack } = useAppContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);

  const deleteFeed = useDeleteFeed();

  const isNavigationFeed = () => {
    return feed.kind === 'navigation';
  };

  const handleDelete = async () => {
    try {
      await deleteFeed(feed.id);
      setReloadPage(!reloadPage); // trigger refresh

      toast.success(t('notifications.feed.remove.success'));
    } catch {
      toast.error(t('notifications.feed.remove.error'));
    } finally {
      setShowDeleteMenu(false);
    }
  };

  const setParent = () => {
    if (isNavigationFeed()) {
      const params = new URLSearchParams(searchParams);
      params.delete('title');
      const previous = params.get('parent-id');

      let path = '';
      if (previous) path = previous + '&' + feed.id;
      else path = feed.id;

      params.set('parent-id', path);
      setSearchParams(params);
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col rounded-xl overflow-hidden shadow-md bg-white dark:bg-darkGray border border-zinc-300 dark:border-zinc-700">
          <button
            className={`p-6 gap-4 flex flex-col items-start justify-between text-left h-full transition-colors 
        ${stuBg} text-white hover:brightness-110 duration-200 
        ${isNavigationFeed() ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={setParent}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="w-full">
              <span className="block text-lg font-bold">{feed.title}</span>
              <span className="block text-sm opacity-80 mt-1">{feed.content}</span>
            </div>
            <div className="flex justify-end w-full text-white">
              {isNavigationFeed() ? (
                isHovering ? <FaFolderOpen size={26} /> : <FaFolder size={26} />
              ) : (
                <MdFeed size={26} />
              )}
            </div>
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2">
            <button
              className={`py-2 flex items-center justify-center text-sm font-medium bg-green text-white hover:brightness-110 transition-colors ${stuBgHover}`}
              onClick={() => {
                umamiTrack('Edit Feed Button', { feedId: feed.id });
                setShowForm(true);
              }}
            >
              <MdEdit size={18} className="mr-1" /> {t('administration.feedsPage.edit')}
            </button>
            <button
              className={`py-2 flex items-center justify-center text-sm font-medium bg-red text-white hover:brightness-110 transition-colors ${stuBgHover}`}
              onClick={() => {
                umamiTrack('Delete Feed Button', { feedId: feed.id });
                setShowDeleteMenu(true);
              }}
            >
              <MdDelete size={18} className="mr-1" /> {t('administration.feedsPage.delete')}
            </button>
          </div>
        </div>

        {/* Form + Confirmation */}
        {showForm && (
          <FeedForm
            setOpen={setShowForm}
            feedId={feed.id}
            reloadPage={reloadPage}
            setReloadPage={setReloadPage}
          />
        )}
        {showDeleteMenu && (
          <ConfirmationDialog
            name={feed.title}
            close={setShowDeleteMenu}
            yes={handleDelete}
            type="feed"
          />
        )}
      </div>
    </>
  );
};

export default AdminFeed;
