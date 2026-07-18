import { useQuery } from '@tanstack/react-query';
import useGetUserDetails from './useGetUserDetails';

/**
 * React Query wrapper around `GET /api/v1/users/:id`. Reuses `useGetUserDetails`
 * and adds caching + shared loading/error state, so pages that show the current
 * user (Profile) no longer full-page-spinner every visit — a cached user renders
 * instantly while a background refetch keeps it fresh.
 */
const useUserDetailsQuery = (userId: string | undefined) => {
  const getUserDetails = useGetUserDetails();

  return useQuery({
    queryKey: ['user-details', userId ?? null],
    queryFn: () => getUserDetails(userId as string),
    enabled: !!userId,
  });
};

export default useUserDetailsQuery;
