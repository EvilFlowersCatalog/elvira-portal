import { useEffect, useState } from 'react';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBox from '../../components/items/entry/EntryBox';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import FilterSuggestions from '../../components/tools/FilterSuggestions';

const Library = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);

  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();

  // Reset when catalog or search params change
  useEffect(() => {
    setPage(0);
    setEntries([]);
    setIsLoading(true);
  }, [selectedCatalogId, searchParams]);

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
          // Current API: single ID params
          categoryId: searchParams.get('category-id') ?? '',
          feedId:
            searchParams.get('feed-id') ??
            searchParams.get('feed-id-step') ??
            '',
          authors: searchParams.get('author') ?? '',
          publishedAtGte: searchParams.get('publishedAtGte') ?? '',
          publishedAtLte: searchParams.get('publishedAtLte') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
          languageCode: searchParams.get('languageCode') ?? '',
          // Experimental API: comma-separated multi-ID params (server param names TBD)
          categories: searchParams.get('categories') ?? '',
          feeds: searchParams.get('feeds') ?? '',
        });

        const allEntries = [...(entries ?? []), ...items];
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        );
        setEntries(uniqueEntries);

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
      title={t('navbarMenu.library')}
    >
      {!isLoading && entries.length > 0 && searchParams.get('query') && (
        <FilterSuggestions searchQuery={searchParams.get('query') || ''} />
      )}
      <EntriesWrapper>
        {entries.map((entry, index) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
        {loadingNext &&
          Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} />
          ))}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Library;
