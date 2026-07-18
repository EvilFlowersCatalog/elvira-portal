import { useMemo } from 'react';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import FilterSuggestions from '../../components/tools/FilterSuggestions';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';

const Library = () => {
  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();

  // Only params that affect the result set go in the query key, so opening a
  // book (which adds entry-detail-id) doesn't reset the list or scroll position.
  const filters = useMemo(
    () => ({
      title: searchParams.get('title') ?? '',
      categoryId: searchParams.get('category-id') ?? '',
      feedId: searchParams.get('feed-id') ?? searchParams.get('feed-id-step') ?? '',
      authors: searchParams.get('author') ?? '',
      publishedAtGte: searchParams.get('publishedAtGte') ?? '',
      publishedAtLte: searchParams.get('publishedAtLte') ?? '',
      orderBy: searchParams.get('order-by') ?? '',
      query: searchParams.get('query') ?? '',
      languageCode: searchParams.get('languageCode') ?? '',
      categories: searchParams.get('categories') ?? '',
      feeds: searchParams.get('feeds') ?? '',
    }),
    [searchParams]
  );

  const list = useInfiniteItemContainer<IEntry>(
    ['entries-infinite', selectedCatalogId, filters],
    (page) => getEntries({ page, limit: 30, ...filters })
  );

  return (
    <ItemContainer
      list={list}
      showLayout
      searchSpecifier="query"
      title={t('navbarMenu.library')}
    >
      {!list.isLoading && list.items.length > 0 && searchParams.get('query') && (
        <FilterSuggestions searchQuery={searchParams.get('query') || ''} />
      )}
      <EntriesWrapper>
        {list.items.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
        {list.loadingNext &&
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Library;
