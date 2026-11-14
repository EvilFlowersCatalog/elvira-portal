import { useQuery } from '@tanstack/react-query';
import useAxios from '../useAxios';
import useGetEntries from '../entries/useGetEntries';
import { IChapterMap, ILibraryMap, IPrerequisite, IRelatedSection } from '../../../utils/interfaces/graph';
import { IEntry } from '../../../utils/interfaces/entry';

// The graph routes answer per caller (what they may read), so nothing here is shared across users:
// React Query's cache lives in this tab and is cleared on logout like every other query.
const STALE = 5 * 60 * 1000;

/** Processed publications as a map: nodes and mutual-nearest-neighbour edges. */
export const useLibraryMap = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['graph-map', import.meta.env.ELVIRA_CATALOG_ID],
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await axios.get<{ response: ILibraryMap }>('/api/v1/entries/map', {
        params: { catalog_id: import.meta.env.ELVIRA_CATALOG_ID },
      });
      return data.response;
    },
  });
};

/** A publication's sections in reading order and how strongly they relate to each other. */
export const useEntryChapters = (entryId: string | undefined) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['graph-chapters', entryId],
    enabled: !!entryId,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IChapterMap }>(`/api/v1/entries/${entryId}/chapters`);
      return data.response;
    },
  });
};

/** Sections of other publications on the same topic, best first. */
export const useSectionRelated = (key: string | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['graph-related', key],
    enabled: !!key,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IRelatedSection[] }>(`/api/v1/sections/${encodeURIComponent(key!)}/related`);
      return data.response ?? [];
    },
  });
};

/** Sections that define a concept this one only discusses. */
export const useSectionPrerequisites = (key: string | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['graph-prerequisites', key],
    enabled: !!key,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IPrerequisite[] }>(`/api/v1/sections/${encodeURIComponent(key!)}/prerequisites`);
      return data.response ?? [];
    },
  });
};

/** Titles, files and config of the publications a graph answer points at (it carries only ids). */
export const useEntriesById = (ids: string[]) => {
  const getEntries = useGetEntries();
  const unique = [...new Set(ids)].sort();
  return useQuery({
    queryKey: ['entries-by-id', unique],
    enabled: unique.length > 0,
    staleTime: STALE,
    queryFn: async () => {
      const { items } = await getEntries({ page: 1, limit: unique.length, ids: unique.join(',') });
      return new Map<string, IEntry>(items.map((item) => [item.id, item]));
    },
  });
};
