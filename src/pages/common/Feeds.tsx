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
import useItemContainer from '../../hooks/useItemContainer';

const Feeds = () => {
  const { selectedCatalogId } = useAppContext();
  const list = useItemContainer<IFeed>();
  const [searchParams] = useSearchParams();
  const [currentFeedDescription, setCurrentFeedDescription] = useState<string>('');
  const [currentFeedTitle, setCurrentFeedTitle] = useState<string>('');

  const { t } = useTranslation();
  const getFeeds = useGetFeeds();
  const getFeedDetail = useGetFeedDetail();

  useEffect(() => {
    list.reset();
  }, [selectedCatalogId]);

  useEffect(() => {
    if (list.page === 0) {
      list.setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];
      const currentFeedId = fp.length > 0 ? fp[fp.length - 1] : null;
      const title = searchParams.get('query') ?? '';
      const parentId = title.length > 0 ? '' : fp.length > 0 ? fp[fp.length - 1] : 'null';

      try {
        const { items, metadata } = await getFeeds({
          paginate: false,
          orderBy: searchParams.get('order-by') ?? '',
          title,
          parentId,
        });

        list.setMaxPage(metadata.pages);
        list.setItems([...(list.items ?? []), ...items]);

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
        list.setIsError(true);
      } finally {
        list.setIsLoading(false);
        list.setLoadingNext(false);
      }
    })();
  }, [list.page]);

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
