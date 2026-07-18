import { useQuery } from '@tanstack/react-query';
import useGetUserChats from './useGetUserChats';
import useAppContext from '../../contexts/useAppContext';

/**
 * React Query wrapper for the current user's AI chat list. Reuses
 * `useGetUserChats` for the request and adds caching / `isLoading` / `isError`.
 * Keyed by catalog so switching catalogs refetches.
 */
const useUserChatsQuery = () => {
  const getUserChats = useGetUserChats();
  const { selectedCatalogId } = useAppContext();

  return useQuery({
    queryKey: ['user-chats', selectedCatalogId],
    queryFn: getUserChats,
  });
};

export default useUserChatsQuery;
