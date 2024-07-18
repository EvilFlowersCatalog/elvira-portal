import { useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from '../../hooks/contexts/useAuthContext.tsx';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general.ts';
import { useTranslation } from 'react-i18next';
import useAddToShelf from '../../hooks/api/my-shelf/useAddToShelf.tsx';
import useRemoveFromShelf from '../../hooks/api/my-shelf/useRemoveFromShelf.tsx';
import { toast } from 'react-toastify';
import { CircleLoader } from 'react-spinners';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail.tsx';
import { useSearchParams } from 'react-router-dom';

interface IEntryListParams {
  entry: IEntry;
  triggerReload?: (() => void) | null;
}

const EntryList = ({ entry, triggerReload = null }: IEntryListParams) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { specialNavigation } = useAppContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shelfRecord, setShelfRecord] = useState<string>(entry.shelf_record_id);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const getEntryDetail = useGetEntryDetail();

  const setFeed = (feedId: string) => {
    searchParams.set('feed-id', feedId);
    setSearchParams(searchParams);
  };

  const handleAdd = async () => {
    // Set to true for loading
    setIsLoading(true);

    try {
      // Add entry to my shelf
      await addToShelf(entry.id);

      // If user is in 'my shelf' reset page to trigger reload
      if (location.pathname === NAVIGATION_PATHS.shelf && triggerReload)
        triggerReload();

      await update(); // update shelf record

      toast.success(t('notifications.myShelf.add.success')); // Notify user
    } catch {
      toast.error(t('notifications.myShelf.add.error')); // notify user
    } finally {
      setIsLoading(false); // whatever happen, set to false to stop loading
    }
  };

  const handleRemove = async () => {
    // Set for loading
    setIsLoading(true);

    // remove
    try {
      await removeFromShelf(entry.shelf_record_id);

      // If user is in 'my shelf' reset page to trigger reload
      if (location.pathname === NAVIGATION_PATHS.shelf && triggerReload)
        triggerReload();

      await update(); // update shelf record

      toast.success(t('notifications.myShelf.remove.success')); // Norify user
    } catch {
      toast.error(t('notifications.myShelf.remove.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // If entryId is changed
  const update = async () => {
    try {
      const { response: entryDetail } = await getEntryDetail(entry.id);
      entry.shelf_record_id = entryDetail.shelf_record_id;
      setShelfRecord(entryDetail.shelf_record_id);
    } catch {
      entry.shelf_record_id = '';
      setShelfRecord('');
    }
  };

  return (
    <div className='flex gap-4 w-full xxl:w-1/2 p-4'>
      <div className='flex flex-1 flex-col gap-2 items-center rounded-md'>
        <img
          className={`w-full rounded-md ${
            imageLoaded ? 'h-auto' : 'h-64'
          } border border-gray dark:border-zinc-200`}
          src={entry.thumbnail + `?access_token=${auth?.token}`}
          alt='Entry Thumbnail'
          onLoad={() => setImageLoaded(true)}
        />
        <span className='flex-1'></span>
        <div className='flex w-full justify-center text-sm'>
          {isLoading ? (
            <CircleLoader className={'my-2.5'} color={'#00abe1'} size={28} />
          ) : shelfRecord ? (
            <button
              className={
                'flex gap-2 items-center px-2 py-1 text-red border border-darkGray border-opacity-0 hover:border-red rounded-md'
              }
              onClick={handleRemove}
            >
              {t('entry.detail.remove')}
            </button>
          ) : (
            <button
              className={
                'flex gap-2 items-center px-2 py-1 text-green border border-darkGray border-opacity-0 hover:border-green rounded-md'
              }
              onClick={handleAdd}
            >
              {t('entry.detail.add')}
            </button>
          )}
        </div>
        <button
          className='bg-STUColor rounded-md px-4 hover:px-8 py-2 uppercase text-white font-bold text-sm duration-200'
          onClick={(e) =>
            specialNavigation(e, NAVIGATION_PATHS.viewer + entry.id)
          }
        >
          <span>{t('entry.detail.read')}</span>
        </button>
      </div>
      <div className='flex flex-col flex-3 text-left items-start gap-1'>
        <h1 className='font-extrabold text-lg'>{entry.title}</h1>
        {entry.authors.length > 0 && (
          <span className='text-left text-sm'>
            {entry.authors
              .map((author) => `${author.name} ${author.surname}`)
              .join(', ')}
          </span>
        )}
        {/* Feeds */}
        <div className={'flex gap-2 w-full'}>
          {entry.feeds.map((feed, index) => (
            <button
              key={index}
              className={
                'px-2 text-sm border border-darkGray text-white border-opacity-0 bg-STUColor hover:bg-opacity-50 rounded-md duration-200'
              }
              onClick={() => setFeed(feed.id)}
            >
              {feed.title}
            </button>
          ))}
        </div>
        <span className='text-[12px]'>{entry.summary ?? '-'}</span>
      </div>
    </div>
  );
};

export default EntryList;
