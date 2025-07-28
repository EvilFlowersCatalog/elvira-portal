import { useState, useEffect } from 'react';
import { CircleLoader } from 'react-spinners';
import { RiAddLine, RiBookmarkFill, RiBookmarkLine, RiChatQuoteLine, RiCloseLine, RiShareLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import useAuthContext from '../../../../hooks/contexts/useAuthContext';
import { IEntryDetail } from '../../../../utils/interfaces/entry';
import useGetEntryDetail from '../../../../hooks/api/entries/useGetEntryDetail';
import useAddToShelf from '../../../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../../../hooks/api/my-shelf/useRemoveFromShelf';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';
import ShelfButton from '../../../buttons/ShelfButton';
import PDFButton from '../../../buttons/PDFButtons';
import { BiBookOpen } from 'react-icons/bi';
import { TabContent, Tabs, TabsComponent, TabsHeader, TabTitle } from './EntryDetailTabs';
import { InfoGrid, InfoItem, InfoItemCustom } from './EntryGrid';
import { SummaryText } from './SummaryText';
import { StatGroup, StatItem } from './StatGroup';
import { DetailHeader } from './DetailHeader';
import { ActionButtonStyle, ActionsButton, ActionsWrapper } from './DetailActions';
import { AcceptedLanguage, getLanguage } from '../../../../hooks/api/languages/languages';
import AcquisitionsButton from '../../../buttons/AcqusitionsButton';

interface IEntryDetailParams {
  triggerReload?: (() => void) | null;
}

const EntryDetail = ({ triggerReload }: IEntryDetailParams) => {
  const { stuColor, stuText, stuBg, umamiTrack } = useAppContext();
  const { auth } = useAuthContext();
  const { t, i18n } = useTranslation();
  const [entry, setEntry] = useState<IEntryDetail | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [update, setUpdate] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

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
      await removeFromShelf(entry.shelf_record_id);

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
    const cite = entry?.citation;
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

  const share = () => {
    
    if (navigator.share) {
      navigator.share({
        title: entry?.title || '',
        text: entry?.summary || '',
        url: window.location.href,
      })
      return;
    }

    umamiTrack('Entry Detail Share Button');
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('notifications.shareSuccess'));
  }

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
            <div className='p-8 bg-lightGray dark:bg-darkGray h-full min-w-[350px] flex flex-col'>
              <div className={`w-full flex justify-center border rounded-md flex-shrink overflow-hidden h-full`}>
                <img className={'w-full h-full object-cover'}
                  src={entry.thumbnail + `?access_token=${auth?.token}`}
                  alt='Entry Thumbnail'
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

              <ActionsWrapper>
                <AcquisitionsButton acquisitions={entry.acquisitions} entry={entry} />
                <ShelfButton
                  isLoading={isLoading}
                  entryId={entryId!}
                  handleAdd={handleAdd}
                  handleRemove={handleRemove}
                  shelfId={entry.shelf_record_id}
                >
                  <ActionsButton>
                    {entry.shelf_record_id ?
                      <><RiBookmarkFill className='fill-primary dark:fill-primaryLight' size={24} />{t('entry.detail.remove')}</>
                      : <><RiBookmarkLine size={24} />{t('entry.detail.add')} </>}
                  </ActionsButton>
                </ShelfButton>
                {entry.citation && (
                  <ActionsButton onClick={copyCite}>
                    <RiChatQuoteLine size={24} />{t('entry.detail.cite')}
                  </ActionsButton>
                )}
                <ActionsButton onClick={share}>
                  <RiShareLine size={24} />{t('entry.detail.share')}
                </ActionsButton>
              </ActionsWrapper>
            </div>

            <div className='p-4 bg-white dark:bg-gray mdlg:overflow-y-auto h-full pb-20 w-full'>
              <DetailHeader
                entry={entry}
                handleParamClick={handleParamClick}
                umamiTrack={umamiTrack}
              />

              <StatGroup>
                <StatItem value={999} label={t('entry.detail.pages')} />
                <StatItem value={9.9} label={t('entry.detail.rating')} />
                <StatItem value={entry.popularity} label={t('entry.detail.views')} />
              </StatGroup>

              {/* Summary */}
              <SummaryText
                html={entry.summary}
                readMoreText={t('entry.detail.readMore')}
                readLessText={t('entry.detail.readLess')}
              />

              {/* Info Grid */}
              <InfoGrid>
                <InfoItem label={t('entry.detail.publisher')}>{entry.publisher ?? '-'}</InfoItem>
                <InfoItem label={t('entry.detail.publishDate')}>{entry.published_at ? new Date(entry.published_at).toLocaleDateString('sk-SK', { year: 'numeric', }) : '-'}</InfoItem>
                <InfoItem label={t('entry.detail.lang')}>{getLanguage(entry.language?.alpha2 || '')?.name[i18n.language as AcceptedLanguage]}</InfoItem>

                <InfoItemCustom label={t('entry.detail.categories')}>
                  <div className="flex flex-col gap-1">
                    {entry.categories.length === 0 ? (
                      <span className="text-secondary dark:text-secondaryLight">-</span>
                    ) : (
                      entry.categories.map((category, index) => (
                        <span
                          key={index}
                          className="text-secondary dark:text-secondaryLight font-extrabold cursor-pointer"
                          onClick={() => {
                            umamiTrack('Entry Detail Category Button Param', {
                              feedId: category.id,
                              entryId: entryId,
                            });
                            handleParamClick('category-id', category.id);
                          }}
                        >{category.term}</span>
                      ))
                    )}
                  </div>
                </InfoItemCustom>
              </InfoGrid>

              {/* TABS */}
              <TabsComponent defaultTab='contents'>
                <TabsHeader>
                  <TabTitle id="contents">{t('entry.detail.tabs.contents')}</TabTitle>
                  <TabTitle id="reviews">{t('entry.detail.tabs.reviews')}</TabTitle>
                  <TabTitle id="related">{t('entry.detail.tabs.related')}</TabTitle>
                </TabsHeader>
                <Tabs>
                  <TabContent id="contents">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('entry.detail.tabs.contents')}
                    </span>
                  </TabContent>
                  <TabContent id="reviews">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('entry.detail.tabs.reviews')}
                    </span>
                  </TabContent>
                  <TabContent id="related">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('entry.detail.tabs.related')}
                    </span>
                  </TabContent>
                </Tabs>
              </TabsComponent>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EntryDetail;