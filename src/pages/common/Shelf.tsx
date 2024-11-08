import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBox from '../../components/items/entry/EntryBox';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';

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
          categoryId: searchParams.get('category-id') ?? '',
          authors: searchParams.get('author') ?? '',
          publishedAtGte: searchParams.get('from') ?? '',
          publishedAtLte: searchParams.get('to') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
          config__readium_enabled: false,
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
    <ItemContainer
      activeEntryId={activeEntryId}
      setActiveEntryId={setActiveEntryId}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      items={entries}
      setItems={setEntries}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
      triggerReload={triggerReload}
      showLayout
      searchSpecifier={'query'}
    >
      <div className='flex flex-wrap p-4 pt-0'>
        {entries.map((entry, index) => (
          <EntryBox
            key={index}
            entry={entry}
            isActive={activeEntryId === entry.id}
          />
        ))}
        {loadingNext &&
          Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} />
          ))}
      </div>
    </ItemContainer>
  );
};

export default Shelf;
