import { useEffect, useState } from 'react';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { useSearchParams } from 'react-router-dom';
import Feed from '../../components/feed/Feed';
import FeedContainer from '../../components/feed/FeedContainer';

const Feeds = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);

  const [searchParams] = useSearchParams();
  const getFeeds = useGetFeeds();

  // When searchParams change, reset
  useEffect(() => {
    setPage(0);
    setFeeds([]);
    setIsLoading(true);
  }, [searchParams]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      try {
        const { items, metadata } = await getFeeds({
          paginate: false,
          title: searchParams.get('title') ?? '',
          parentId: searchParams.get('parent-id') ?? 'null',
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
    <FeedContainer
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      feeds={feeds}
      setFeeds={setFeeds}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
    >
      <div className='flex flex-wrap px-3 pb-4'>
        {feeds.map((feed, index) => (
          <Feed key={index} feed={feed} />
        ))}
      </div>
    </FeedContainer>
  );
};

export default Feeds;
