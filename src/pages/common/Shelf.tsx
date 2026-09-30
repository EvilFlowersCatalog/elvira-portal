import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IEntry, IEntriesList } from '../../utils/interfaces/entry';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { useEntryFilters } from '../../hooks/api/entries/entryFilters';
import useShelfEntryIds, { SHELF_ENTRY_IDS_KEY } from '../../hooks/api/my-shelf/useShelfEntryIds';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';

const Shelf = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const getEntries = useGetEntries();
  const filters = useEntryFilters();
  const { data: shelfEntryIds } = useShelfEntryIds();

  // The shelf is listed through the entries endpoint restricted to the shelved ids,
  // so every advanced-search filter applies. `null` while the ids are loading.
  const ids = useMemo(() => (shelfEntryIds ? shelfEntryIds.join(',') : null), [shelfEntryIds]);

  const list = useInfiniteItemContainer<IEntry>(
    ['shelf', filters, ids],
    async (page) => {
      // An empty `id` filter would match the whole catalog — short-circuit instead.
      if (!ids) return { items: [], metadata: { pages: 1 } } as unknown as IEntriesList;
      return getEntries({ page, limit: 30, ...filters, ids });
    },
    { enabled: ids !== null }
  );

  // Removing a book changes the shelved ids, which changes the list's query key.
  const triggerReload = () => queryClient.invalidateQueries({ queryKey: SHELF_ENTRY_IDS_KEY });

  return (
    <ItemContainer
      list={list}
      triggerReload={triggerReload}
      showLayout
      searchSpecifier="query"
      title={t('navbarMenu.myShelf')}
      shouldRedirectSuggestions={true}
      entryScope={ids === null ? null : { ids }}
    >
      <EntriesWrapper>
        {list.items.map((entry) => (
          <EntryItem key={entry.id} entry={entry} triggerReload={triggerReload} />
        ))}
        {list.loadingNext &&
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} fixedSize />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Shelf;
