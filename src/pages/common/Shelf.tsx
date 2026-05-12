import { useEffect } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useItemContainer from '../../hooks/useItemContainer';

const Shelf = () => {
  const list = useItemContainer<IEntry>();
  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();
  const getShelf = useGetShelf();

  useEffect(() => {
    list.reset();
  }, [selectedCatalogId, searchParams]);

  useEffect(() => {
    if (list.page === 0) {
      list.setPage(1);
      return;
    }

    (async () => {
      try {
        const { items, metadata } = await getShelf({
          page: list.page,
          limit: 30,
          title: searchParams.get('title') ?? '',
          feedId: searchParams.get('feed-id') ?? '',
          categoryId: searchParams.get('category-id') ?? '',
          authors: searchParams.get('author') ?? '',
          publishedAtGte: searchParams.get('publishedAtGte') ?? '',
          publishedAtLte: searchParams.get('publishedAtLte') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
          languageCode: searchParams.get('languageCode') ?? '',
        });

        list.setMaxPage(metadata.pages);
        const shelfEntries = items.map((item: any) => {
          const entry = item.entry;
          entry.shelf_record_id = item.id;
          return entry;
        });

        const allEntries = [...list.items, ...shelfEntries];
        const uniqueEntries = Array.from(
          new Map(allEntries.map((entry) => [entry.id, entry])).values()
        );
        list.setItems(uniqueEntries);
      } catch {
        list.setIsError(true);
      } finally {
        list.setIsLoading(false);
        list.setLoadingNext(false);
      }
    })();
  }, [list.page]);

  const triggerReload = () => list.reset();

  return (
    <ItemContainer
      list={list}
      triggerReload={triggerReload}
      showLayout
      searchSpecifier="query"
      title={t('navbarMenu.myShelf')}
      shouldRedirectSuggestions={true}
    >
      <EntriesWrapper>
        {list.items.map((entry) => (
          <EntryItem key={entry.id} entry={entry} triggerReload={triggerReload} />
        ))}
        {list.loadingNext &&
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Shelf;
