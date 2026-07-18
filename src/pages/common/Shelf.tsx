import { useMemo } from 'react';
import { IEntry, IEntryQuery } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';

const Shelf = () => {
  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();
  const getShelf = useGetShelf();

  const filters = useMemo(
    () => ({
      title: searchParams.get('title') ?? '',
      feedId: searchParams.get('feed-id') ?? '',
      categoryId: searchParams.get('category-id') ?? '',
      authors: searchParams.get('author') ?? '',
      publishedAtGte: searchParams.get('publishedAtGte') ?? '',
      publishedAtLte: searchParams.get('publishedAtLte') ?? '',
      orderBy: searchParams.get('order-by') ?? '',
      query: searchParams.get('query') ?? '',
      languageCode: searchParams.get('languageCode') ?? '',
    }),
    [searchParams]
  );

  const list = useInfiniteItemContainer<IEntry>(
    ['shelf', selectedCatalogId, filters],
    async (page) => {
      const { items, metadata } = await getShelf({
        page,
        limit: 30,
        ...filters,
      } as IEntryQuery);
      // Shelf records wrap the entry; unwrap it and tag it with the record id
      // (used by EntryItem to remove the item from the shelf).
      const entries = items.map((item: any) => {
        const entry = item.entry;
        entry.shelf_record_id = item.id;
        return entry;
      });
      return { items: entries, metadata };
    }
  );

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
