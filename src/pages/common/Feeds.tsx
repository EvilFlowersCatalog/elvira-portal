import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';
import ItemContainer from '../../components/items/container/ItemContainer';
import Feed from '../../components/items/feeds/Feed';
import LoadNext from '../../components/items/loadings/LoadNext';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';

const Feeds = () => {
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();
  const [currentFeedDescription, setCurrentFeedDescription] = useState<string>('');
  const [currentFeedTitle, setCurrentFeedTitle] = useState<string>('');

  const { t } = useTranslation();
  const getFeeds = useGetFeeds();
  const getFeedDetail = useGetFeedDetail();

  // Current level in the drill-down chain (parent-id = folderA&folderB&…).
  const currentFeedId = useMemo(() => {
    const fp = searchParams.get('parent-id')?.split('&').filter(Boolean) ?? [];
    return fp.length > 0 ? fp[fp.length - 1] : null;
  }, [searchParams]);

  const filters = useMemo(() => {
    const title = searchParams.get('query') ?? '';
    // A text query searches everywhere; otherwise scope to the current folder.
    const parentId = title.length > 0 ? '' : currentFeedId ?? 'null';
    return { title, parentId, orderBy: searchParams.get('order-by') ?? '' };
  }, [searchParams, currentFeedId]);

  const list = useInfiniteItemContainer<IFeed>(
    ['feeds-infinite', selectedCatalogId, filters],
    () => getFeeds({ paginate: false, ...filters })
  );

  // Resolve the current folder's title/description for the header.
  useEffect(() => {
    if (!currentFeedId || currentFeedId === 'null') {
      setCurrentFeedDescription('');
      setCurrentFeedTitle('');
      return;
    }
    let alive = true;
    getFeedDetail(currentFeedId)
      .then((feed) => {
        if (!alive) return;
        setCurrentFeedDescription(feed.content || '');
        setCurrentFeedTitle(feed.title || '');
      })
      .catch(() => {
        if (!alive) return;
        setCurrentFeedDescription('');
        setCurrentFeedTitle('');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFeedId]);

  return (
    <ItemContainer
      list={list}
      isEntries={true}
      searchSpecifier="query"
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
          {list.items.map((feed, index) => (
            <Feed key={index} feed={feed} />
          ))}
          {list.loadingNext && <LoadNext />}
        </div>
      </div>
    </ItemContainer>
  );
};

export default Feeds;
