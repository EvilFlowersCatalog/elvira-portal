import { useEffect, useState } from 'react';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import { MdAdd } from 'react-icons/md';
import AdminFeed from '../../components/items/feeds/admin/AdminFeed';
import FeedForm from '../../components/items/feeds/admin/FeedForm';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';

const AdminFeeds = () => {
  const { stuBg, stuBorder, umamiTrack } = useAppContext();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const getFeeds = useGetFeeds();

  // When searchParams change or is triggered reload -> Reset page
  useEffect(() => {
    setPage(0);
    setFeeds([]);
    setIsLoading(true);
  }, [reloadPage]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];

      try {
        const { items, metadata } = await getFeeds({
          page: page,
          limit: 50,
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
    <>
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
        showEmpty={false}
        searchSpecifier={'title'}
        title={t('administration.homePage.feeds.title')}
      >
        <div className='grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4'>
          {/* Add button */}
          <div className={'w-full'}>
            <button
              onClick={() => {
                umamiTrack('Add Feed Button');
                setShowForm(true);
              }}
              className={`
        flex flex-col justify-center items-center gap-3 w-full h-full p-8 
        rounded-xl border-4 border-dashed border-zinc-300 dark:border-zinc-600 
        text-zinc-500 dark:text-zinc-400 hover:text-primary hover:border-primary 
        hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200
      `}
            >
              <MdAdd size={40} />
              <span className="font-semibold text-lg">{t('administration.feedsPage.add')}</span>
            </button>
          </div>
          {/* FEEDS */}

          {feeds.map((feed, index) => (
            <AdminFeed
              key={index}
              feed={feed}
              reloadPage={reloadPage}
              setReloadPage={setReloadPage}
            />
          ))}
        </div>
      </ItemContainer>
      {showForm && (
        <FeedForm
          setOpen={setShowForm}
          reloadPage={reloadPage}
          setReloadPage={setReloadPage}
        />
      )}
    </>
  );
};

export default AdminFeeds;
