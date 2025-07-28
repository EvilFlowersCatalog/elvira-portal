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

const Library = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const { t } = useTranslation();
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
          languageCode: searchParams.get('language-code') ?? '',
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
      title={t('navbarMenu.library')}
    >
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
