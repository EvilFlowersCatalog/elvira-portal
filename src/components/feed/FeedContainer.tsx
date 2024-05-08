import { useSearchParams } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import Breadcrumb from '../common/Breadcrumb';
import PageLoading from '../page/PageLoading';
import PageMessage from '../page/PageMessage';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import LoadNext from '../common/LoadNext';
import ScrollUpButton from '../common/ScrollUpButton';
import ToolsContainer from '../tools/ToolsContainer';
import { IFeed } from '../../utils/interfaces/feed';

interface IFeedContainer {
  children: ReactNode;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isError: boolean;
  feeds: IFeed[];
  setFeeds: (entries: IFeed[]) => void;
  page: number;
  setPage: (page: number) => void;
  maxPage: number;
  loadingNext: boolean;
  setLoadingNext: (loadingNext: boolean) => void;
}

const FeedContainer = ({
  children,
  isLoading,
  isError,
  feeds,
  setFeeds,
  setIsLoading,
  page,
  loadingNext,
  setLoadingNext,
  setPage,
  maxPage,
}: IFeedContainer) => {
  const { handleScroll, searchParamsEqual, clearFilters } = useAppContext();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousSearchParamsRef = useRef<URLSearchParams | null>(null);

  // Check search params if there is entry-detail-id
  useEffect(() => {
    // If they are not equal reset
    if (!searchParamsEqual(previousSearchParamsRef.current, searchParams)) {
      setPage(0);
      setFeeds([]);
      setIsLoading(true);
    }

    // Set previous to current
    previousSearchParamsRef.current = searchParams;
  }, [searchParams]);

  return (
    <>
      <div
        ref={scrollRef}
        className='flex flex-col flex-1 overflow-auto'
        onScroll={() =>
          handleScroll(
            scrollRef,
            page,
            setPage,
            maxPage,
            loadingNext,
            setLoadingNext,
            showScrollUp,
            setShowScrollUp
          )
        }
      >
        <Breadcrumb />
        <ToolsContainer param='title' />
        {isLoading && <PageLoading />}
        {!isLoading && isError && <PageMessage message={t('page.error')} />}
        {!isLoading && !isError && feeds.length > 0 && (
          <>
            {children}
            {loadingNext && <LoadNext />}
          </>
        )}
        {!isLoading &&
          !isError &&
          feeds.length === 0 &&
          (searchParams.toString() !== '' ? (
            <PageMessage
              message={t('page.notFound')}
              clearParams={clearFilters}
            />
          ) : (
            // Possible only in shelf
            <PageMessage message={t('page.shelfEmpty')} />
          ))}
      </div>
      {showScrollUp && <ScrollUpButton scrollRef={scrollRef} />}
    </>
  );
};

export default FeedContainer;
