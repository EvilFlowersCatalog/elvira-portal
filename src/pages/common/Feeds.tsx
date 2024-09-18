import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import ItemContainer from '../../components/items/container/ItemContainer';
import Feed from '../../components/items/feeds/Feed';
import LoadNext from '../../components/items/loadings/LoadNext';
import useAppContext from '../../hooks/contexts/useAppContext';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';
import useCustomEffect from '../../hooks/useCustomEffect';

const Feeds = () => {
  const { feedParents, setFeedParents } = useAppContext();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [searchParams] = useSearchParams();
  const [tmp, setTmp] = useState<{ id: string; title: string }[]>([]);

  const location = useLocation();

  const getFeeds = useGetFeeds();
  const getFeedDetail = useGetFeedDetail();

  useCustomEffect(() => {
    const fp = searchParams.get('parent-id')?.split('&');
    setTmp([]);

    (async () => {
      if (fp) {
        await Promise.all(
          fp.map(async (id) => {
            const t = feedParents.filter((feed) => feed.id === id)[0];
            if (t) return { id: t.id, title: t.title };
            try {
              const { response: detail } = await getFeedDetail(id);
              return { id, title: detail.title };
            } catch {
              return { id, title: 'feed' };
            }
          })
        ).then((results) => {
          setTmp(results);
        });
      }
    })();
  }, [location.search]);

  useCustomEffect(() => {
    setFeedParents(tmp);
  }, [tmp]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];

      try {
        const { items, metadata } = await getFeeds({
          paginate: false,
          title: searchParams.get('title') ?? '',
          parentId: fp.length > 0 ? fp[fp.length - 1] : 'null',
          orderBy: searchParams.get('order-by') ?? '',
        });

        // Set items and metadata
        setMaxPage(metadata.pages);
        setFeeds([...(feeds ?? []), ...items]);
      } catch {
        // if there was error set to true
        setIsError(true);
      } finally {
        // after everything set false
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
      isEntries={false}
      searchSpecifier={'title'}
    >
      <div className='flex flex-wrap px-3 pb-4'>
        {feeds.map((feed, index) => (
          <Feed key={index} feed={feed} />
        ))}
        {loadingNext && <LoadNext />}
      </div>
    </ItemContainer>
  );
};

export default Feeds;
