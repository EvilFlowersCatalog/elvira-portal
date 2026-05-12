import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';
import ItemContainer from '../../components/items/container/ItemContainer';
import Feed from '../../components/items/feeds/Feed';
import LoadNext from '../../components/items/loadings/LoadNext';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';

const Feeds = () => {
  const { selectedCatalogId } = useAppContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [searchParams] = useSearchParams();

  const { t } = useTranslation();
  const getFeeds = useGetFeeds();
  const getFeedDetail = useGetFeedDetail();
  const [currentFeedDescription, setCurrentFeedDescription] = useState<string>('');
  const [currentFeedTitle, setCurrentFeedTitle] = useState<string>('');

  // Reload feeds when catalog changes
  useEffect(() => {
    setPage(0);
    setFeeds([]);
    setIsLoading(true);
  }, [selectedCatalogId]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];
      const currentFeedId = fp.length > 0 ? fp[fp.length - 1] : null;

      const title = searchParams.get('query') ?? '';

      // When searching, go global; otherwise drill down into the current parent
      const parentId = title.length > 0 ? '' : (fp.length > 0 ? fp[fp.length - 1] : 'null');

      const options = {
        paginate: false,
        orderBy: searchParams.get('order-by') ?? '',
        title,
        parentId,
      };

      try {
        const { items, metadata } = await getFeeds(options);

        setMaxPage(metadata.pages);
        setFeeds([...(feeds ?? []), ...items]);

        // Fetch parent feed title for section heading when navigated into a subfeed
        if (currentFeedId && currentFeedId !== 'null') {
          try {
            const feedDetail = await getFeedDetail(currentFeedId);
            setCurrentFeedDescription(feedDetail.content || '');
            setCurrentFeedTitle(feedDetail.title || '');
          } catch {
            setCurrentFeedDescription('');
            setCurrentFeedTitle('');
          }
        } else {
          setCurrentFeedDescription('');
          setCurrentFeedTitle('');
        }
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
        setLoadingNext(false);
      }
    })();
  }, [page]);

  return (
    <ItemContainer
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      items={feeds}
      setItems={setFeeds}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
      isEntries={true}
      searchSpecifier={'query'}
      title={t('navbarMenu.feeds')}
      description={currentFeedDescription}
      shouldRedirectSuggestions={true}
      showResultsHeading={false}
    >
      <div className='flex flex-col px-3 pb-4 gap-4'>
        {currentFeedTitle && (
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>
            {currentFeedTitle}
          </h2>
        )}
        <div className='flex flex-wrap'>
          {feeds.map((feed, index) => (
            <Feed key={index} feed={feed} />
          ))}
          {loadingNext && <LoadNext />}
        </div>
      </div>
    </ItemContainer>
  );
};

export default Feeds;
