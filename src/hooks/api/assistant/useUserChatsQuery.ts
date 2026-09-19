import { useQuery } from '@tanstack/react-query';
import { IAssistantChatQuery } from '../../../utils/interfaces/assistant';
import useGetUserChats from './useGetUserChats';

/**
 * React Query wrapper for the current user's AI chat list. Reuses
 * `useGetUserChats` for the request and adds caching / `isLoading` / `isError`.
 */
const useUserChatsQuery = (query: IAssistantChatQuery = {}) => {
  const getUserChats = useGetUserChats();

  return useQuery({
    queryKey: ['user-chats', query],
    queryFn: () => getUserChats(query),
  });
};

export default useUserChatsQuery;
