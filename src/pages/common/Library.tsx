import { useEffect, useState } from 'react';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import EntryContainer from '../../components/entry/EntryContainer';
import Entry from '../../components/entry/Entry';

const Library = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();

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
          orderBy: searchParams.get('order-by') ?? '-created_at',
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
    >
      <div className='flex flex-wrap px-4'>
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

export default Library;
