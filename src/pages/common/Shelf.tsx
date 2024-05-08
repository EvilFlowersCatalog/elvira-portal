import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import EntryContainer from '../../components/entry/EntryContainer';
import Entry from '../../components/entry/Entry';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';

const Shelf = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const getShelf = useGetShelf();

  useEffect(() => {
    // skip nitialization
    if (page === 0) {
      setPage(1);
      return;
    }

    // get entries
    (async () => {
      try {
        const { items, metadata } = await getShelf({
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
        // extract shelf entries
        const shelfEntries = items.map((item) => item.entry);

        setEntries([...(entries ?? []), ...shelfEntries]);
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

  const triggerReload = () => {
    setPage(0);
    setEntries([]);
    setIsLoading(true);
  };

  return (
    <EntryContainer
      activeEntryId={activeEntryId}
      setActiveEntryId={setActiveEntryId}
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
      triggerReload={triggerReload}
    >
      <div className='flex flex-wrap px-4 pb-4'>
        {entries.map((entry, index) => (
          <Entry
            key={index}
            entry={entry}
            isActive={activeEntryId === entry.id}
          />
        ))}
      </div>
    </EntryContainer>
  );
};

export default Shelf;
