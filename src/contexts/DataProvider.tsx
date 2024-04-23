import { CircleLoader } from 'react-spinners';
import { DATA_TYPE } from '../utils/interfaces/general/general';
import { createContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IDataPageContext,
  IDataProviderParams,
} from '../utils/interfaces/contexts';
import { IEntry } from '../utils/interfaces/entry';
import { IFeed } from '../utils/interfaces/feed';
import useGetEntries from '../hooks/api/entries/useGetEntries';
import useGetFeeds from '../hooks/api/feeds/useGetFeeds';
import useGetShelf from '../hooks/api/my-shelf/useGetShelf';
import { debounce } from '@mui/material';
import useAppContext from '../hooks/useAppContext';
import PageError from '../components/data-page/PageError';

export const DataContext = createContext<IDataPageContext | null>(null);

const DataProvider = ({ type, children }: IDataProviderParams) => {
  const { STUColor } = useAppContext();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousSearchParamsRef = useRef<URLSearchParams | null>(null);
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [data, setData] = useState<IEntry[] | IFeed[] | null>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshPage, setRefreshPage] = useState<boolean>(false);
  const getEntries = useGetEntries();
  const getFeeds = useGetFeeds();
  const getShelf = useGetShelf();

  // Check params except entry detail id
  const areSearchParamsEqual = (
    prevSearchParams: URLSearchParams | null,
    currentSearchParams: URLSearchParams
  ) => {
    // If we do not have prev return false
    if (!prevSearchParams) return false;

    // Get prev params except entry-detail-id
    const { 'entry-detail-id': prevId, ...prevRest } = Object.fromEntries(
      prevSearchParams.entries()
    );

    // Get current params except entry-detail-id
    const { 'entry-detail-id': currId, ...currRest } = Object.fromEntries(
      currentSearchParams.entries()
    );

    // Chcek prev
    for (let key in prevRest) {
      if (prevRest[key] !== currRest[key]) {
        return false;
      }
    }
    // Chcek curr
    for (let key in currRest) {
      if (prevRest[key] !== currRest[key]) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    // If they are not equal reset
    if (!areSearchParamsEqual(previousSearchParamsRef.current, searchParams)) {
      setPage(0);
      setData([]);
    }

    // Set previous to current
    previousSearchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    // When triggered, refresh
    setPage(0);
    setData([]);
  }, [refreshPage]);

  useEffect(() => {
    // Skip initial render
    if (page === 0) {
      setPage(1);
      return;
    }

    // Set loading
    setIsLoading(true);

    const LoadData = async () => {
      try {
        // GET DATA FOR LIBRARY
        if (type === DATA_TYPE.entries) {
          // Get data by params
          const entries = await getEntries({
            page,
            limit: 25,
            title: searchParams.get('title') ?? '',
            feedId: searchParams.get('feed-id') ?? '',
            orderBy: searchParams.get('order-by') ?? '-created_at',
          });

          // Set items and metadata
          setMaxPage(entries.metadata.pages);
          setData([...((data ?? []) as IEntry[]), ...entries.items]);
        }
        // GET DATA FOR FEEDS
        else if (type === DATA_TYPE.feeds) {
          // Get data by params
          const feeds = await getFeeds({
            page: page,
            limit: 50,
            title: searchParams.get('title') ?? '',
            parentId: searchParams.get('parent-id') ?? 'null',
            orderBy: searchParams.get('order-by') ?? '',
          });

          // Set items and metadata
          setMaxPage(feeds.metadata.pages);
          setData([...((data ?? []) as IFeed[]), ...feeds.items]);
        }
        // GET DATA FOR MY SHELF
        else if (type === DATA_TYPE.myShelf) {
          // Get data by params
          const shelf = await getShelf({
            page,
            limit: 25,
            title: searchParams.get('title') ?? '',
            feedId: searchParams.get('feed-id') ?? '',
            orderBy: searchParams.get('order-by') ?? '',
          });

          // Set items and metadata
          setMaxPage(shelf.metadata.pages);
          setData([
            ...((data ?? []) as IEntry[]),
            ...shelf.items.map((item) => item.entry),
          ]);
        }
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    LoadData();
  }, [page]);

  // handle scrolling when on the bottom set next page if possible
  const handleScroll = debounce(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (
        scrollTop + clientHeight > scrollHeight - 200 &&
        page !== maxPage &&
        !isLoading
      )
        setPage((prevPage) => prevPage + 1);
    }
  });

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        setIsLoading,
        refreshPage,
        setRefreshPage,
      }}
    >
      <div
        className='main-body flex flex-col overflow-auto'
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {data !== null ? (
          <>
            {children}
            {page !== maxPage && (
              <div className='w-full h-20'>
                <div className={'flex w-full h-20 justify-center items-center'}>
                  {isLoading && data.length > 0 && page !== maxPage && (
                    <CircleLoader color={STUColor} size={50} />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <PageError />
        )}
      </div>
    </DataContext.Provider>
  );
};

export default DataProvider;
