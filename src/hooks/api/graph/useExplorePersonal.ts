import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { config } from '@/lib/config';
import useAxios from '../useAxios';
import { IActivityList } from '../../../utils/interfaces/activity';
import { IMyShelfList } from '../../../utils/interfaces/my-shelf';
import { IEntry } from '../../../utils/interfaces/entry';
import { PersonalMark } from '../../../utils/func/exploreGraph';

const READ_ACTIONS = new Set(['entry_downloaded', 'license_downloaded', 'loan_created']);

/**
 * The reader's own layer of the Explore map: what they read (history) and what is on their shelf.
 * Both lists carry the publications themselves, so their covers need no further request.
 */
export default function useExplorePersonal() {
  const axios = useAxios();

  const activity = useQuery({
    queryKey: ['explore-personal-activity', config.ELVIRA_CATALOG_ID],
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data } = await axios.get<IActivityList>('/api/v1/activity', {
        params: { page: 1, limit: 200, catalog_id: config.ELVIRA_CATALOG_ID, order_by: '-last_occurred_at' },
      });
      return data.items;
    },
  });

  const shelf = useQuery({
    queryKey: ['explore-personal-shelf', config.ELVIRA_CATALOG_ID],
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data } = await axios.get<IMyShelfList>('/api/v1/shelf-records', {
        params: { paginate: 'false', catalog_id: config.ELVIRA_CATALOG_ID },
      });
      return data.items;
    },
  });

  return useMemo(() => {
    const marks = new Map<string, PersonalMark>();
    const entries = new Map<string, IEntry>();
    (activity.data ?? []).forEach((a) => {
      if (!a.entry || !READ_ACTIONS.has(a.action)) return;
      const mark = marks.get(a.entry.id) ?? {};
      if (!mark.readAt || a.last_occurred_at > mark.readAt) mark.readAt = a.last_occurred_at;
      mark.reads = (mark.reads ?? 0) + (a.count || 1);
      marks.set(a.entry.id, mark);
      entries.set(a.entry.id, a.entry);
    });
    (shelf.data ?? []).forEach((s) => {
      if (!s.entry) return;
      const mark = marks.get(s.entry.id) ?? {};
      mark.shelfAt = s.created_at;
      marks.set(s.entry.id, mark);
      entries.set(s.entry.id, s.entry);
    });
    return { marks, entries };
  }, [activity.data, shelf.data]);
}
