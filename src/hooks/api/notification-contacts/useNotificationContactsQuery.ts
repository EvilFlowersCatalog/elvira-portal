import { useQuery, keepPreviousData } from '@tanstack/react-query';
import useGetNotificationContacts from './useGetNotificationContacts';
import useAuthContext from '../../contexts/useAuthContext';

export const notificationContactsQueryKey = (userId: string | null | undefined) => [
  'notification-contacts',
  userId ?? null,
];

/**
 * React Query wrapper around the caller's notification contacts. Keyed on the
 * user so the profile section and the reserve-flow nudge share one cache entry;
 * mutations invalidate `['notification-contacts']` to refresh both.
 */
const useNotificationContactsQuery = (options?: { enabled?: boolean }) => {
  const getNotificationContacts = useGetNotificationContacts();
  const { auth } = useAuthContext();

  return useQuery({
    queryKey: notificationContactsQueryKey(auth?.userId),
    queryFn: () => getNotificationContacts(),
    enabled: (options?.enabled ?? true) && !!auth,
    placeholderData: keepPreviousData,
  });
};

export default useNotificationContactsQuery;
