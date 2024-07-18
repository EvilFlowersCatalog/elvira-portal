import { useEffect, useState } from 'react';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items-container/ItemContainer';
import EntryBox from '../../components/entry/EntryBox';
import useAppContext from '../../hooks/contexts/useAppContext';
import { LAYOUT_TYPE } from '../../utils/interfaces/general/general';
import EntryList from '../../components/entry/EntryList';
import EntryListLoading from '../../components/entry/loading/EntryListLoading';
import EntryBoxLoading from '../../components/entry/loading/EntryBoxLoading';

const Library = () => {
  const { layout } = useAppContext();
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
      showLayout
      searchSpecifier={'query'}
    >
      <div className='flex flex-wrap p-4 pt-0'>
        {layout === LAYOUT_TYPE.list
          ? entries.map((entry, index) => (
              <EntryList key={index} entry={entry} />
            ))
          : entries.map((entry, index) => (
              <EntryBox
                key={index}
                entry={entry}
                isActive={activeEntryId === entry.id}
              />
            ))}
        {loadingNext &&
          (layout === LAYOUT_TYPE.list
            ? Array.from({ length: 30 }).map((_, index) => (
                <EntryListLoading key={index} />
              ))
            : Array.from({ length: 30 }).map((_, index) => (
                <EntryBoxLoading key={index} />
              )))}
      </div>
    </ItemContainer>
  );
};

export default Library;
