import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';

const Shelf = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const { t } = useTranslation();
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
          publishedAtGte: searchParams.get('publishedAtGte') ?? '',
          publishedAtLte: searchParams.get('publishedAtLte') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
        });

        setMaxPage(metadata.pages);
        // extract shelf entries
        const shelfEntries = items.map((item) => item.entry);

        const allEntries = [...entries, ...shelfEntries];
        const uniqueShelfEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        );

        setEntries(uniqueShelfEntries);
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
      title={t('navbarMenu.myShelf')}
    >
     <EntriesWrapper>
        {entries.map((entry, index) => (
          <EntryItem key={entry.id} entry={entry} triggerReload={triggerReload}/>
        ))}
        {loadingNext &&
          Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} />
          ))}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Shelf;
