import { useState, MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEntry } from '../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useAddToShelf from '../../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../../hooks/api/my-shelf/useRemoveFromShelf';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { toast } from 'react-toastify';
import { CircleLoader } from 'react-spinners';
import Button from '../../buttons/Button';
import ShelfButton from '../../buttons/ShelfButton';
import PDFButtons from '../../buttons/PDFButtons';

interface IEntryListParams {
  entry: IEntry;
  triggerReload?: (() => void) | null;
}

const EntryList = ({ entry, triggerReload = null }: IEntryListParams) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const getEntryDetail = useGetEntryDetail();

  const setParam = (name: string, value: string) => {
    searchParams.set(name, value);
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
    } catch {}
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

        <ShelfButton
          isLoading={isLoading}
          handleAdd={handleAdd}
          handleRemove={handleRemove}
          entryId={entry.id}
          shelfId={entry.shelf_record_id}
        />
        <PDFButtons acquisitions={entry.acquisitions} entryId={entry.id} />
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
              onClick={() => setParam('feed-id', feed.id)}
            >
              {feed.title}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className={'flex gap-2 w-full'}>
          {entry.categories.map((category, index) => (
            <button
              key={index}
              className={
                'px-2 text-sm border border-darkGray text-white border-opacity-0 bg-STUColor hover:bg-opacity-50 rounded-md duration-200'
              }
              onClick={() => setParam('category-id', category.id)}
            >
              {category.term}
            </button>
          ))}
        </div>
        <span
          className={'text-sm'}
          dangerouslySetInnerHTML={{
            __html: entry.summary ?? '-',
          }}
        ></span>
      </div>
    </div>
  );
};

export default EntryList;
