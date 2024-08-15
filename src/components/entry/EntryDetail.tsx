import { useState, MouseEvent, useEffect } from 'react';
import { CircleLoader } from 'react-spinners';
import { RiArrowRightDoubleFill } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryDetail } from '../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useAddToShelf from '../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../hooks/api/my-shelf/useRemoveFromShelf';
import useCustomEffect from '../../hooks/useCustomEffect';
import useAuthContext from '../../hooks/contexts/useAuthContext';

interface IEntryDetailParams {
  triggerReload?: (() => void) | null;
}
const EntryDetail = ({ triggerReload }: IEntryDetailParams) => {
  const { specialNavigation, STUColor } = useAppContext();
  const { auth } = useAuthContext();
  const { t } = useTranslation();
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [update, setUpdate] = useState<boolean>(false);
  const getEntryDetail = useGetEntryDetail();
  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();

  const handleAdd = async () => {
    if (!entryId) return;
    // Set to true for loading
    setIsLoading(true);

    try {
      // Add entry to my shelf
      await addToShelf(entryId);

      // If user is in 'my shelf' reset page to trigger reload
      if (location.pathname === NAVIGATION_PATHS.shelf && triggerReload)
        triggerReload();

      setUpdate((prevUpdate) => !prevUpdate); // Set to oposite for trigger update

      toast.success(t('notifications.myShelf.add.success')); // Notify user
    } catch {
      toast.error(t('notifications.myShelf.add.error')); // notify user
    } finally {
      setIsLoading(false); // whatever happen, set to false to stop loading
    }
  };

  const handleRemove = async () => {
    if (!entry) return;
    // Set for loading
    setIsLoading(true);

    // remove
    try {
      await removeFromShelf(entry.response.shelf_record_id);

      // If user is in 'my shelf' reset page to trigger reload
      if (location.pathname === NAVIGATION_PATHS.shelf && triggerReload)
        triggerReload();

      setUpdate((prevUpdate) => !prevUpdate); // trigger update

      toast.success(t('notifications.myShelf.remove.success')); // Norify user
    } catch {
      toast.error(t('notifications.myShelf.remove.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = (e: MouseEvent<HTMLButtonElement>) => {
    specialNavigation(e, NAVIGATION_PATHS.viewer + entry!.response.id);
  };

  useEffect(() => {
    const paramEntryId = searchParams.get('entry-detail-id');
    setEntryId(paramEntryId);
  }, [searchParams]);

  // If entryId is changed
  useCustomEffect(() => {
    // Reset
    setEntry(null);
    if (!entryId) return;

    (async () => {
      try {
        const entryDetail = await getEntryDetail(entryId);
        setEntry(entryDetail);
      } catch {
        setEntry(null);
      }
    })();
  }, [entryId, update]);

  const setFeed = (feedId: string) => {
    searchParams.set('feed-id', feedId);
    setSearchParams(searchParams);
  };

  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-full md:w-2/4 lg:w-2/5 xl:w-1/4 bg-darkGray bg-opacity-95 flex flex-col p-4 overflow-auto`}
    >
      <button
        className='bg-STUColor text-white h-fit w-fit rounded-md p-2 mb-4'
        onClick={() => {
          searchParams.delete('entry-detail-id');
          setSearchParams(searchParams);
        }}
      >
        <RiArrowRightDoubleFill size={18} />
      </button>
      {!entry ? (
        <div className={'flex justify-center h-full items-center'}>
          <CircleLoader color={STUColor} size={50} />
        </div>
      ) : (
        <div className={'flex-1 flex flex-col'}>
          <div className={'flex flex-col gap-2 justify-center items-center'}>
            <div
              className={
                'w-full text-white text-center text-md font-bold uppercase'
              }
            >
              {entry.response.title}
            </div>
            <div className={'w-full flex flex-col items-center'}>
              {isLoading ? (
                <CircleLoader
                  className={'my-2.5'}
                  color={'#00abe1'}
                  size={28}
                />
              ) : entry.response.shelf_record_id ? (
                <button
                  className={
                    'flex gap-2 items-center px-2 py-1 text-red mb-2 border border-darkGray border-opacity-0 hover:border-red rounded-md'
                  }
                  onClick={handleRemove}
                >
                  {t('entry.detail.remove')}
                </button>
              ) : (
                <button
                  className={
                    'flex gap-2 items-center px-2 py-1 text-green mb-2 border border-darkGray border-opacity-0 hover:border-green rounded-md'
                  }
                  onClick={handleAdd}
                >
                  {t('entry.detail.add')}
                </button>
              )}
              <div
                className={
                  'w-1/2 flex justify-center border border-white rounded-md overflow-hidden'
                }
              >
                <img
                  className={'w-full min-h-52'}
                  src={
                    entry.response.thumbnail + `?access_token=${auth?.token}`
                  }
                  alt='Entry Thumbnail'
                />
              </div>
            </div>
            {entry.response.authors.length > 0 && (
              <>
                <span className={'text-white text-center font-bold'}>
                  {entry.response.authors[0].name}
                  {entry.response.authors[0].surname}
                </span>
                <div
                  className={`flex flex-col items-center text-zinc-300 text-center`}
                >
                  {entry.response.authors.slice(1).map((author, index) => (
                    <span key={index}>
                      {author.name} {author.surname}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div
              className={
                'flex w-full justify-evenly items-center h-16 bg-gray rounded-md'
              }
            >
              {/* Detail */}
              <div className={'flex flex-col items-center'}>
                <span className={'text-STUColor font-extrabold'}>120</span>
                <span className={'text-white'}>{t('entry.detail.pages')}</span>
              </div>
              <span className={'h-3/6 border-l border-white'}></span>
              <div className={'flex flex-col items-center'}>
                <span className={'text-STUColor font-extrabold'}>
                  {entry.response.popularity}
                </span>
                <span className={'text-white'}>{t('entry.detail.views')}</span>
              </div>
              <span className={'h-3/6 border-l border-white'}></span>
              <div className={'flex flex-col items-center'}>
                <span className={'text-STUColor font-extrabold'}>
                  {entry.response.language?.code ?? 'SK'}
                </span>
                <span className={'text-white'}>{t('entry.detail.lang')}</span>
              </div>
            </div>

            <div className='my-5'>
              <Button onClick={handleRead}>
                <span>{t('entry.detail.read')}</span>
              </Button>
            </div>

            {/* Feeds */}
            <div className='w-full text-left'>
              <span className={'text-white font-bold'}>
                {t('entry.detail.feeds')}
              </span>
            </div>
            <div className={'flex gap-2 w-full'}>
              {entry.response.feeds.map((feed, index) => (
                <button
                  key={index}
                  className={
                    'px-2 py-1 border border-darkGray text-white border-opacity-0 bg-STUColor hover:bg-opacity-50 rounded-md duration-200'
                  }
                  onClick={() => setFeed(feed.id)}
                >
                  {feed.title}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className='w-full text-left'>
              <span className={'text-white font-bold'}>
                {t('entry.detail.summary')}
              </span>
            </div>
            <span className={'text-white text-left w-full'}>
              {entry.response.summary ? entry.response.summary : '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryDetail;
