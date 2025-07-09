import { useState, useEffect } from 'react';
import { CircleLoader } from 'react-spinners';
import { RiAddLine, RiBookmarkFill, RiBookmarkLine, RiChatQuoteLine, RiCloseLine, RiShareLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { IEntryDetail } from '../../../utils/interfaces/entry';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import useAddToShelf from '../../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../../hooks/api/my-shelf/useRemoveFromShelf';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import ShelfButton from '../../buttons/ShelfButton';
import PDFButtons from '../../buttons/PDFButtons';
import { BiBookOpen } from 'react-icons/bi';

interface IEntryDetailParams {
  triggerReload?: (() => void) | null;
}
const EntryDetail = ({ triggerReload }: IEntryDetailParams) => {
  const { stuColor, stuText, stuBg, umamiTrack } = useAppContext();
  const { auth } = useAuthContext();
  const { t } = useTranslation();
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [update, setUpdate] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [showFullSummary, setShowFullSummary] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

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
      setIsLoading(false); // whatever happens, set to false to stop loading
    }
  };

  const handleRemove = async () => {
    if (!entry) return;
    // Set for loading
    setIsLoading(true);

    // remove
    try {
      await removeFromShelf(entry.response.shelf_record_id);

      // If user is in 'my shelf' trigger reload
      if (location.pathname === NAVIGATION_PATHS.shelf && triggerReload)
        triggerReload();

      setUpdate((prevUpdate) => !prevUpdate); // trigger update

      toast.success(t('notifications.myShelf.remove.success')); // Notify user
    } catch {
      toast.error(t('notifications.myShelf.remove.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleParamClick = (name: string, value: string) => {
    if (location.pathname === NAVIGATION_PATHS.library) {
      searchParams.set(name, value);
      setSearchParams(searchParams);
    } else {
      const params = new URLSearchParams();
      params.set(name, value);
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: params.toString(),
      });
    }
  };

  const copyCite = () => {
    const cite = entry?.response.citation;
    if (!cite) {
      toast.error(t('notifications.citation.noCite'));
      return;
    }
    navigator.clipboard.writeText(cite).then(() => {
        toast.success(t('notifications.citation.copySuccess'));
    }, () => {
        toast.error(t('notifications.citation.copyError'));
    });
  };


  useEffect(() => {
    const paramEntryId = searchParams.get('entry-detail-id');
    setEntryId(paramEntryId);
  }, [searchParams]);

  // If entryId is changed
  useEffect(() => {
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

  return (
    <div className='fixed top-0 right-0 z-50 h-full w-full bg-black bg-opacity-60 flex items-center justify-center'>
      <div className='absolute bg-white dark:bg-gray max-w-6xl rounded-xl w-full h-full max-h-[90vh] mdlg:overflow-hidden overflow-auto rounded-md shadow-lg flex flex-col'>
        <div className='w-full pl-8 pr-4 py-2 flex items-center border-b-[1px] border-lightGray dark:border-darkGray'>
          <h2 className='text-secondary dark:text-secondaryLight text-lg font-bold'>
            {t('entry.detail.title')}
          </h2>
          <button
            className={`text-black dark:text-white p-0 ml-auto`}
            onClick={() => {
              umamiTrack('Close Entry Detail Button');
              searchParams.delete('entry-detail-id');
              setSearchParams(searchParams);
            }}
          >
            <RiCloseLine size={32} />
          </button>
        </div>
        {!entry ? (
          <div className={'flex justify-center h-full items-center'}>
            <CircleLoader color={stuColor} size={50} />
          </div>
        ) : (
          <div className={'flex h-full flex-col mdlg:flex-row'}>
            <div className='p-8 bg-lightGray dark:bg-darkGray h-full min-w-[350px]'>
              <div className={'w-full flex flex-col items-center'}>
                <div className={`w-full flex justify-center max-w-[300px] border rounded-md ${imageLoaded ? 'h-auto' : 'h-64'} overflow-hidden`}>
                  <img className={'w-full h-full'}
                    src={entry.response.thumbnail + `?access_token=${auth?.token}`}
                    alt='Entry Thumbnail'
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 py-4'>
                <PDFButtons
                  acquisitions={entry.response.acquisitions}
                  entryId={entry.response.id}> <button
                    className={`w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex justify-start gap-4 border-[1px] border-darkGray dark:border-lightGray`}>
                    <BiBookOpen size={24} />{t('entry.detail.read')}
                  </button>
                </PDFButtons>
                <ShelfButton
                  isLoading={isLoading}
                  entryId={entryId!}
                  handleAdd={handleAdd}
                  handleRemove={handleRemove}
                  shelfId={entry.response.shelf_record_id}
                >
                  <button
                    className={`w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex justify-start gap-4 border-[1px] border-darkGray dark:border-lightGray`}>
                    {entry.response.shelf_record_id ?
                      <><RiBookmarkFill className='fill-primary dark:fill-primaryLight' size={24} />{t('entry.detail.remove')}</>
                      : <><RiBookmarkLine size={24} />{t('entry.detail.add')} </>}
                  </button>
                </ShelfButton>
                <button onClick={copyCite}
                  className={`w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex justify-start gap-4 border-[1px] border-darkGray dark:border-lightGray`}>
                  <RiChatQuoteLine size={24} />{t('entry.detail.cite')}
                </button>
                <button
                  className={`w-full px-4 py-2 rounded-lg text-darkGray dark:text-lightGray font-light flex justify-start gap-4 border-[1px] border-darkGray dark:border-lightGray`}>
                  <RiShareLine size={24} />{t('entry.detail.share')}
                </button>
              </div>
            </div>
            <div className='p-4 bg-white dark:bg-gray mdlg:overflow-y-auto h-full pb-20'>

              {/* Feeds */}
              <div className={'mb-6 flex gap-2 w-full'}>
                {entry.response.feeds.length === 0 && (
                  <span className='text-white'>-</span>
                )}
                {entry.response.feeds.map((feed, index) => (
                  <button
                    key={index}
                    className={`cursor-pointer font-semibold px-2 py-1 text-md bg-primaryLight text-primary rounded-lg`}
                    onClick={() => {
                      umamiTrack('Entry Detail Feed Button Param', {
                        feedId: feed.id,
                        entryId: entryId,
                      });
                      handleParamClick('feed-id', feed.id);
                    }}
                  >
                    {feed.title}
                  </button>
                ))}
              </div>

              <h1 className='w-full text-secondary dark:text-secondaryLight text-xl font-bold mb-3'>{entry.response.title}</h1>
              {entry.response.authors.length > 0 && (
                <div className=''>
                  <span className={'text-darkGray dark:text-lightGray text-center font-light text-xl'}>
                    {entry.response.authors[0].name}{' '}
                    {entry.response.authors[0].surname}
                  </span>
                  <div
                    className={`flex text-zinc-500`}
                  >
                    {entry.response.authors.slice(1).map((author, index, arr) => (
                      <span key={index}>
                        {author.name} {author.surname}
                        {index < arr.length - 1 && <span>,&nbsp;</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className='flex flex-wrap gap-10 w-full text-left my-10'>
                <div className={'flex flex-col'}>
                  <span className={`text-primary dark:text-primaryLight text-2xl font-medium`}>{999}</span>
                  <span className={'text-gray dark:text-white text-light text-small'}>{t('entry.detail.pages')}</span>
                </div>
                <div className={'flex flex-col'}>
                  <span className={`text-primary dark:text-primaryLight text-2xl font-medium`}>{9.9}</span>
                  <span className={'text-gray dark:text-white text-light text-small'}>{t('entry.detail.rating')}</span>
                </div>
                <div className={'flex flex-col'}>
                  <span className={`text-primary dark:text-primaryLight text-2xl font-medium`}>{entry.response.popularity}</span>
                  <span className={'text-gray dark:text-white text-light text-small'}>{t('entry.detail.views')}</span>
                </div>
              </div>

              {/* Summary */}
              <div className='w-full text-left'>
              </div>
              {entry.response.summary && (
                <div className="w-full text-left">
                  <span
                    className={'text-gray-500 dark:text-white'}
                    dangerouslySetInnerHTML={{
                      __html: !showFullSummary
                        ? entry.response.summary.slice(0, 240) +
                        (entry.response.summary.length > 240 ? '...' : '')
                        : entry.response.summary,
                    }}
                  ></span>
                  {entry.response.summary.length > 240 && !showFullSummary && (
                    <button
                      className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                      onClick={() => setShowFullSummary(true)}
                    >
                      <RiAddLine size={24} /> {t('entry.detail.readMore')}
                    </button>
                  )}
                  {showFullSummary && (
                    <button
                      className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                      onClick={() => setShowFullSummary(false)}
                    >
                      <RiCloseLine size={24} /> {t('entry.detail.readLess')}
                    </button>
                  )}
                </div>
              )}

              {/* Info Grid */}

              <div className='grid grid-cols-2 gap-4 mt-6'>
                <div className='flex flex-col'>
                  <span className={'text-darkGray dark:text-lightGray uppercase'}>
                    {t('entry.detail.publisher')}
                  </span>
                  <span className={`text-secondary dark:text-secondaryLight font-extrabold`}>
                    {entry.response.publisher ?? '-'}
                  </span>
                </div>

                <div className='flex flex-col'>
                  <span className={'text-darkGray dark:text-lightGray uppercase'}>
                    {t('entry.detail.publishDate')}
                  </span>
                  <span className={`text-secondary dark:text-secondaryLight font-extrabold`}>
                    {entry.response.published_at ?
                      new Date(entry.response.published_at).toLocaleDateString('sk-SK', { year: 'numeric' })
                      : '-'}
                  </span>
                </div>

                <div className='flex flex-col'>
                  <span className={'text-darkGray dark:text-lightGray uppercase'}>
                    {t('entry.detail.lang')}
                  </span>
                  <span className={`text-secondary dark:text-secondaryLight font-extrabold`}>
                    {entry.response.language?.alpha2?.toLocaleUpperCase() ??
                      entry.response.language?.alpha3?.toLocaleUpperCase() ??
                      '-'}
                  </span>
                </div>

                <div className='flex flex-col'>
                  <span className={'text-darkGray dark:text-lightGray uppercase'}>
                    {t('entry.detail.categories')}
                  </span>
                  <div className='flex flex-col gap-1'>
                    {entry.response.categories.length === 0 ? (
                      <span className='text-white'>-</span>
                    ) : (
                      entry.response.categories.map((category, index) => (
                        <span
                          key={index}
                          className={`text-secondary dark:text-secondaryLight font-extrabold cursor-pointer`}
                          onClick={() => {
                            umamiTrack('Entry Detail Category Button Param', {
                              feedId: category.id,
                              entryId: entryId,
                            });
                            handleParamClick('category-id', category.id);
                          }}
                        >
                          {category.term}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default EntryDetail;