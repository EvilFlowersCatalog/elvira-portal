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
  const { stuBgHover, stuBg } = useAppContext();

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
      <div
        className={
          'relative flex flex-col p-2.5 w-full lg:w-1/2 xl:w-1/3 xxl:w-1/4'
        }
      >
        <button
          className={`p-5 py-10 gap-5 w-full h-full flex text-center justify-between items-center ${stuBg} text-white rounded-t-md ${
            isNavigationFeed() ? '' : 'cursor-default'
          }`}
          onClick={setParent}
          onMouseEnter={() => setIsHovering(true)}
          onMouseOut={() => setIsHovering(false)}
        >
          <div
            className={
              'w-full flex flex-col text-center sm:text-left pointer-events-none'
            }
          >
            <span className={'text-xl font-bold'}>{feed.title}</span>
            <span className={'text-xs'}>{feed.content}</span>
          </div>

          <div
            className={
              'w-20 h-full pointer-events-none flex items-center justify-end'
            }
          >
            {isNavigationFeed() ? (
              isHovering ? (
                <FaFolderOpen size={30} />
              ) : (
                <FaFolder size={30} />
              )
            ) : (
              <MdFeed size={30} />
            )}
          </div>
        </button>
        <div className='flex'>
          <button
            className={`flex flex-1 justify-center py-2 bg-green text-white rounded-bl-md ${stuBgHover}`}
            onClick={() => {
              umami.track('Edit Feed Button', {
                feedId: feed.id,
              });
              setShowForm(true);
            }}
          >
            <MdEdit size={20} />
          </button>
          <button
            className={`flex flex-1 justify-center py-2 bg-red text-white rounded-br-md ${stuBgHover}`}
            onClick={() => {
              umami.track('Delete Feed Button', {
                feedId: feed.id,
              });
              setShowDeleteMenu(true);
            }}
          >
            <MdDelete size={20} />
          </button>
        </div>
      </div>
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
          type='feed'
        />
      )}
    </>
  );
};

export default AdminFeed;
