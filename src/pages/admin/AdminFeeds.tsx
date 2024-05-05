import { useEffect, useRef, useState } from 'react';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { useSearchParams } from 'react-router-dom';
import PageLoading from '../../components/page/PageLoading';
import Breadcrumb from '../../components/common/Breadcrumb';
import ToolsContainer from '../../components/tools/ToolsContainer';
import ScrollUpButton from '../../components/common/ScrollUpButton';
import useAppContext from '../../hooks/contexts/useAppContext';
import LoadNext from '../../components/common/LoadNext';
import AdminFeed from '../../components/feed/admin/AdminFeed';
import { MdAdd } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import PageMessage from '../../components/page/PageMessage';

const AdminFeeds = () => {
  const { t } = useTranslation();
  const { handleScroll } = useAppContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

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
          page: page,
          limit: 50,
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
      {isLoading && <PageLoading />}
      {!isLoading && isError && <PageMessage message={t('page.error')} />}
      {!isLoading && !isError && feeds.length > 0 && (
        <>
          <ToolsContainer />
          <div className='flex flex-row flex-wrap px-2'>
            {/* Add button */}
            <div className={'flex p-2.5 w-full lg:w-1/2 xl:w-1/3 xxl:w-1/4'}>
              <button
                onClick={() => setShowForm(true)}
                className={`flex flex-col justify-center dark:text-white text-black items-center p-2 w-full rounded-md border-4 border-dashed border-spacing-8 border-STUColor bg-STUColor bg-opacity-40 hover:bg-opacity-20 duration-200`}
              >
                <MdAdd size={50} />
              </button>
            </div>
            {/* FEEDS */}

            {feeds.map((feed, index) => (
              <AdminFeed key={index} feed={feed} />
            ))}
          </div>
          {showScrollUp && <ScrollUpButton scrollRef={scrollRef} />}
          {loadingNext && <LoadNext />}
        </>
      )}
      {!isLoading && !isError && feeds.length === 0 && (
        <PageMessage message={t('page.notFound')} />
      )}
    </div>
  );
};

export default AdminFeeds;
