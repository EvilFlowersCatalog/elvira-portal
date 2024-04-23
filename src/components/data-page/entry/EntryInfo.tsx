import { useEffect, useState, MouseEvent } from 'react';
import { CircleLoader } from 'react-spinners';
import { RiArrowRightDoubleLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoAddCircle, IoRemoveCircle } from 'react-icons/io5';
import Button from '../../common/Button';
import { toast } from 'react-toastify';
import { useLocation, useSearchParams } from 'react-router-dom';
import useAppContext from '../../../hooks/useAppContext';
import { IEntryDetail } from '../../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useDataPage from '../../../hooks/useDataContext';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import useAddToShelf from '../../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../../hooks/api/my-shelf/useRemoveFromShelf';

interface IEntryInfoParams {
  entryId: string | null;
}
export default function EntryInfo({ entryId }: IEntryInfoParams) {
  const { specialNavigation, STUColor } = useAppContext();
  const { setRefreshPage, refreshPage } = useDataPage();
  const { t } = useTranslation();
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [isContributorsOpen, setIsContributorsOpen] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [closeButtonHover, setCloseButtonHover] = useState<boolean>(false);
  const [update, setUpdate] = useState<boolean>(false);
  const location = useLocation();
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

      // If user is in 'my shelf' trigger refresh
      if (location.pathname.includes(NAVIGATION_PATHS.myShelf))
        setRefreshPage(!refreshPage);

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

      // If user is in 'my shelf' update refresg
      if (location.pathname.includes(NAVIGATION_PATHS.myShelf))
        setRefreshPage(!refreshPage);

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

  // If entryId is changed
  useEffect(() => {
    // Reset
    setEntry(null);
    if (!entryId) return;

    const setEntryDetail = async () => {
      try {
        const entryDetail = await getEntryDetail(entryId);
        setEntry(entryDetail);
      } catch {
        setEntry(null);
      }
    };

    setEntryDetail();
  }, [entryId, update]);

  const setFeed = (feedId: string) => {
    searchParams.set('feed-id', feedId);
    setSearchParams(searchParams);
  };

  return (
    <div
      className={`fixed top-0 ${
        entryId ? 'right-0' : '-right-[100vw]'
      } z-50 h-full w-full md:w-2/4 lg:w-2/5 xl:w-1/4 bg-darkGray bg-opacity-95 flex flex-col duration-500`}
    >
      <button
        className={
          'w-full top-0 right-0 flex bg-STUColor text-white text-lg justify-left items-center gap-5 px-5 h-[70px] hover:bg-lightBlue'
        }
        onClick={() => {
          searchParams.delete('entry-detail-id');
          setSearchParams(searchParams);
        }}
        onMouseEnter={() => setCloseButtonHover(true)}
        onMouseLeave={() => setCloseButtonHover(false)}
      >
        {t('entry.detail.close')}
        <div className='relative flex flex-1 items-center mr-8 duration-200'>
          <div
            className={`absolute ${
              closeButtonHover ? 'left-full' : 'left-0'
            } duration-500`}
          >
            <RiArrowRightDoubleLine color={'white'} size={40} />
          </div>
        </div>
      </button>
      {entry ? (
        <>
          <div
            className={
              'realtive h-full w-full flex flex-col p-5 pb-72 overflow-auto'
            }
          >
            <div className={'flex flex-col gap-2 justify-center'}>
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
                    <IoRemoveCircle size={30} />
                    {t('entry.detail.remove')}
                  </button>
                ) : (
                  <button
                    className={
                      'flex gap-2 items-center px-2 py-1 text-green mb-2 border border-darkGray border-opacity-0 hover:border-green rounded-md'
                    }
                    onClick={handleAdd}
                  >
                    <IoAddCircle size={30} />
                    {t('entry.detail.add')}
                  </button>
                )}
                <div
                  className={
                    'w-1/2 flex justify-center border border-white rounded-md overflow-hidden'
                  }
                >
                  <img className={'w-full'} src={entry.response.thumbnail} />
                </div>
              </div>
              <span className={'text-white text-center'}>
                {entry.response.authors[0].name}{' '}
                {entry.response.authors[0].surname}
              </span>
              {entry.response.authors.slice(1).length > 0 && (
                <>
                  <button
                    className={
                      'text-lightGray flex justify-center items-center gap-2'
                    }
                    onClick={() =>
                      setIsContributorsOpen((prevIsOpen) => !prevIsOpen)
                    }
                  >
                    {t('entry.detail.contributors')}
                    {isContributorsOpen ? (
                      <FaChevronUp color='white' />
                    ) : (
                      <FaChevronDown color='white' />
                    )}
                  </button>

                  <div
                    className={`flex flex-col items-center text-lightGray text-center ${
                      isContributorsOpen ? '' : 'h-0'
                    } overflow-hidden`}
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
                  'flex justify-evenly items-center h-16 bg-gray rounded-md'
                }
              >
                {/* Detail */}
                <div className={'flex flex-col items-center'}>
                  <span className={'text-STUColor font-extrabold'}>120</span>
                  <span className={'text-white'}>
                    {t('entry.detail.pages')}
                  </span>
                </div>
                <span className={'h-3/6 border-l border-white'}></span>
                <div className={'flex flex-col items-center'}>
                  <span className={'text-STUColor font-extrabold'}>
                    {entry.response.popularity}
                  </span>
                  <span className={'text-white'}>
                    {t('entry.detail.views')}
                  </span>
                </div>
                <span className={'h-3/6 border-l border-white'}></span>
                <div className={'flex flex-col items-center'}>
                  <span className={'text-STUColor font-extrabold'}>
                    {entry.response.language?.code ?? 'SK'}
                  </span>
                  <span className={'text-white'}>{t('entry.detail.lang')}</span>
                </div>
              </div>

              {/* Feeds */}
              <span className={'text-white font-bold'}>
                {t('entry.detail.feeds')}
              </span>
              <div className={'flex gap-2'}>
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
              <span className={'text-white font-bold'}>
                {t('entry.detail.summary')}
              </span>
              <span className={'text-white text-left'}>
                {entry.response.summary}
              </span>
            </div>
            <div
              className={
                'absolute w-full bottom-0 right-0 h-[40%] pointer-events-none'
              }
            >
              <div
                className={
                  'h-4/5 w-full bg-darkGray bg-gradient-to-t from-darkGray to-transparent bg-opacity-0'
                }
              ></div>
              <div
                className={
                  'h-1/5 w-full bg-darkGray flex justify-center items-center pointer-events-auto'
                }
              >
                <Button onClick={handleRead}>
                  <span>{t('entry.detail.read')}</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={'flex justify-center h-full items-center'}>
          <CircleLoader color={STUColor} size={50} />
        </div>
      )}
    </div>
  );
}
