import { useQuery, keepPreviousData } from '@tanstack/react-query';
import useGetLicenses from './useGetLicenses';
import useAuthContext from '../../contexts/useAuthContext';

type LicensesQueryParams = Parameters<ReturnType<typeof useGetLicenses>>[0];

/**
 * React Query wrapper around the licenses endpoint. Reuses `useGetLicenses` for
 * param building (single source of truth) and adds caching, de-duplication,
 * retries and `isLoading`/`isFetching`/`isError` state. Previous results are
 * kept while a new page/filter loads so consumer lists don't flash to empty.
 *
 * The query key includes the resolved user id so switching users (or logging in)
 * refetches, and defers until auth is available.
 */
const useLicensesQuery = (
  params: LicensesQueryParams,
  options?: { enabled?: boolean }
) => {
  const getLicenses = useGetLicenses();
  const { auth } = useAuthContext();

  return useQuery({
    queryKey: ['licenses', auth?.userId ?? null, params],
    queryFn: () => getLicenses(params),
    enabled: (options?.enabled ?? true) && !!auth,
    placeholderData: keepPreviousData,
  });
};

export default useLicensesQuery;
