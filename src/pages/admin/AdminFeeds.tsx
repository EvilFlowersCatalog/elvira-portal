import { useEffect, useState } from 'react';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import { MdAdd } from 'react-icons/md';
import AdminFeed from '../../components/items/feeds/admin/AdminFeed';
import FeedForm from '../../components/items/feeds/admin/FeedForm';

const AdminFeeds = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

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
      >
        <div className='flex flex-row flex-wrap px-2 pb-4'>
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
