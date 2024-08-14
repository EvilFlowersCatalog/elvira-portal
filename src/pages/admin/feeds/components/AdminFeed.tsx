import { MdDelete, MdEdit, MdFeed } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { FaCircleArrowRight } from 'react-icons/fa6';
import { useState } from 'react';
import { IFeed } from '../../../../utils/interfaces/feed';
import FeedForm from './FeedForm';
import useDeleteFeed from '../../../../hooks/api/feeds/useDeleteFeed';
import { toast } from 'react-toastify';
import Confirmation from '../../../../components/dialogs/ConfirmationDialog';
import { useTranslation } from 'react-i18next';

interface IFeedParams {
  feed: IFeed;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const AdminFeed = ({ feed, reloadPage, setReloadPage }: IFeedParams) => {
  const { t } = useTranslation();
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
      params.set('parent-id', feed.id);
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
          className={`p-5 py-10 gap-5 w-full flex text-center justify-between items-center bg-STUColor text-white rounded-t-md duration-200 ${
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
          {isNavigationFeed() && (
            <div
              className={
                'w-20 h-full relative pointer-events-none hidden sm:flex'
              }
            >
              <div
                className={`absolute top-0.5 bottom-0.5 right-0.5 ${
                  !isHovering ? 'w-full' : 'w-0'
                } overflow-hidden rounded-md flex justify-center items-center duration-300`}
              >
                <MdFeed size={34} />
              </div>
              <div
                className={`absolute top-0.5 bottom-0.5 right-0.5 ${
                  isHovering ? 'w-full' : 'w-0'
                } overflow-hidden rounded-md flex justify-center items-center duration-300`}
              >
                <FaCircleArrowRight size={30} />
              </div>
            </div>
          )}
        </button>
        <div className='flex'>
          <button
            className='flex flex-1 justify-center py-2 bg-green text-white rounded-bl-md hover:bg-STUColor'
            onClick={() => setShowForm(true)}
          >
            <MdEdit size={20} />
          </button>
          <button
            className='flex flex-1 justify-center py-2 bg-red text-white rounded-br-md hover:bg-STUColor'
            onClick={() => setShowDeleteMenu(true)}
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
        <Confirmation
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
