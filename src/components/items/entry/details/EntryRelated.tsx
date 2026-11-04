import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import useGetEntries from '../../../../hooks/api/entries/useGetEntries';
import useSimilarEntries from '../../../../hooks/api/entries/useSimilarEntries';
import EntryItem from '../display/EntryItem';

/** "Súvisiace": publications similar to this one by the extraction index (IP-018 Phase 8). */
export const EntryRelated = ({ entryId }: { entryId: string }) => {
  const { t } = useTranslation();
  const { getSimilarToEntry } = useSimilarEntries();
  const getEntries = useGetEntries();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['entry-similar', entryId],
    queryFn: async () => {
      const similar = await getSimilarToEntry(entryId, 12);
      if (!similar.length) return [];
      const { items } = await getEntries({ page: 1, limit: similar.length, ids: similar.map((s) => s.entry_id).join(',') });
      // Keep the similarity order, not the listing's.
      const byId = new Map(items.map((item) => [item.id, item]));
      return similar.map((s) => byId.get(s.entry_id)).filter((item): item is NonNullable<typeof item> => !!item);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <CircleLoader size={32} color="#0077cc" />
      </div>
    );
  }
  if (!entries?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('entry.detail.related.empty')}</p>;
  }
  return (
    <div className="text-gray-600 dark:text-gray-300 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
      {entries.map((item) => (
        <EntryItem key={item.id} entry={item} />
      ))}
    </div>
  );
};

export default EntryRelated;
