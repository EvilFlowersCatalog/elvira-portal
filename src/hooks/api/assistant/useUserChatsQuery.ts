import { useQuery } from '@tanstack/react-query';
import useGetUserChats from './useGetUserChats';

/**
 * React Query wrapper for the current user's AI chat list. Reuses
 * `useGetUserChats` for the request and adds caching / `isLoading` / `isError`.
 */
const useUserChatsQuery = () => {
  const getUserChats = useGetUserChats();

  return useQuery({
    queryKey: ['user-chats'],
    queryFn: getUserChats,
  });
};

export default useUserChatsQuery;
