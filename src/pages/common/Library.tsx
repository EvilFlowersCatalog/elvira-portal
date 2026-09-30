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

const Library = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();
  const filters = useEntryFilters();

  const list = useInfiniteItemContainer<IEntry>(
    ['entries-infinite', filters],
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
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} fixedSize />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Library;
