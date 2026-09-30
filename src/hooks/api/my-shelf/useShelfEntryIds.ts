import { useQuery } from '@tanstack/react-query';
import { IMyShelfList } from '../../../utils/interfaces/my-shelf';
import useAxios from '../useAxios';

export const SHELF_ENTRY_IDS_KEY = ['shelf-entry-ids'];

/**
 * IDs of every entry on the user's shelf. The Shelf page lists them through the
 * entries endpoint (`id=` filter) instead of `/shelf-records`, so the shelf gets
 * the full advanced search (multi-value filters, year, availability) and facet
 * counts scoped to the shelf.
 */
const useShelfEntryIds = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: SHELF_ENTRY_IDS_KEY,
    queryFn: async () => {
      const { data } = await axios.get<IMyShelfList>('/api/v1/shelf-records', {
        params: { paginate: 'false', catalog_id: import.meta.env.ELVIRA_CATALOG_ID },
      });
      return data.items.map((record) => record.entry.id);
    },
    // Books are added to the shelf from other pages (detail, viewer) without
    // touching this query — always re-check when the Shelf page mounts.
    refetchOnMount: 'always',
  });
};

export default useShelfEntryIds;
