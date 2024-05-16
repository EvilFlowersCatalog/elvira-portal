import { useEffect, useState } from 'react';
import { IEntry } from '../../../utils/interfaces/entry';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useGetEntries from '../../../hooks/api/entries/useGetEntries';
import EntryContainer from '../../../components/entry/EntryContainer';
import AdminEntry from '../../../components/entry/admin/AdminEntry';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { MdAdd } from 'react-icons/md';
import useAppContext from '../../../hooks/contexts/useAppContext';
import EntriesLoading from '../../../components/entry/EntryLoading';
import EntryLoading from '../../../components/entry/EntryLoading';

const AdminEntries = () => {
  const { showSearchBar } = useAppContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);

  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();
  const navigate = useNavigate();

  useEffect(() => {
    // skip nitialization
    if (page === 0) {
      setPage(1);
      return;
    }

    // get entries
    (async () => {
      try {
        const { items, metadata } = await getEntries({
          page,
          limit: 30,
          title: searchParams.get('title') ?? '',
          feedId: searchParams.get('feed-id') ?? '',
          authors: searchParams.get('author') ?? '',
          publishedAtGte: searchParams.get('from') ?? '',
          publishedAtLte: searchParams.get('to') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
        });

        setMaxPage(metadata.pages);
        setEntries([...(entries ?? []), ...items]);
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
    <EntryContainer
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      entries={entries}
      setEntries={setEntries}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
    >
      <div className='flex flex-wrap px-3 pb-4'>
        <div
          className={`flex p-2 w-full sm:w-1/2 md:w-1/4 ${
            showSearchBar
              ? 'lg:w-1/3 xl:w-1/4 xxl:w-1/6'
              : 'xl:w-1/5 xxl:w-[14.28%]'
          }`}
        >
          <button
            className={`flex flex-col justify-center min-h-72 dark:text-white text-black items-center p-2 w-full rounded-md border-4 border-dashed border-spacing-8 border-STUColor bg-STUColor bg-opacity-40 hover:bg-opacity-20 duration-200`}
            onClick={() => navigate(NAVIGATION_PATHS.adminAddEntries)}
          >
            <MdAdd size={50} />
          </button>
        </div>

        {entries.map((entry, index) => (
          <AdminEntry key={index} entry={entry} />
        ))}
        {loadingNext &&
          Array.from({ length: 30 }).map((_, index) => (
            <EntryLoading key={index} />
          ))}
      </div>
    </EntryContainer>
  );
};

export default AdminEntries;
