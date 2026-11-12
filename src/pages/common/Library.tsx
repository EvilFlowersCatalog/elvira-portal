import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { useEntryFilters } from '../../hooks/api/entries/entryFilters';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import FilterSuggestions from '../../components/tools/FilterSuggestions';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';
import usePassageSearch from '../../hooks/api/entries/usePassageSearch';

const Library = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();
  const filters = useEntryFilters();

  // The first page carries the facet counts (`include=facets`), so the grid, the
  // sidebar and the suggestion chips come from one request.
  const list = useInfiniteItemContainer<IEntry>(
    ['entries-infinite', filters],
    (page, signal) =>
      getEntries({ page, limit: 30, ...filters, include: page === 1 ? 'facets' : undefined }, signal),
    { withFacets: true }
  );

  // Search inside books, scoped by the same filters (ordering doesn't apply).
  const query = (searchParams.get('query') ?? '').trim();
  const passageFilters = { ...filters, orderBy: '', query: '' };
  const passages = usePassageSearch(query, { limit: 6, perEntry: 1, filters: passageFilters });

  return (
    <ItemContainer
      list={list}
      showLayout
      searchSpecifier="query"
      title={t('navbarMenu.library')}
    >
      {!list.isLoading && list.items.length > 0 && searchParams.get('query') && (
        <FilterSuggestions
          searchQuery={searchParams.get('query') || ''}
          facets={list.facets?.data}
          passageHits={query ? passages.data?.items : undefined}
        />
      )}
      <EntriesWrapper>
        {list.items.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
        {list.loadingNext &&
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} fixedSize />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Library;
