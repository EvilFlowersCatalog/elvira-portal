import { useQuery, keepPreviousData } from '@tanstack/react-query';
import useGetReservations from './useGetReservations';
import useAuthContext from '../../contexts/useAuthContext';
import { RESERVATION_STATUS } from '../../../utils/interfaces/reservation';

interface Params {
  page?: number;
  limit?: number;
  status?: RESERVATION_STATUS | RESERVATION_STATUS[];
}

/**
 * React Query wrapper around the caller's reservations. Reuses
 * `useGetReservations` and adds caching + shared loading/error state so consumers
 * (the loans page) no longer refetch the whole queue on unrelated URL changes
 * (e.g. opening an entry-detail modal). Keeps previous rows on a background
 * refetch after a claim/cancel so the list never flashes empty.
 */
const useReservationsQuery = (params: Params = {}, options?: { enabled?: boolean }) => {
  const getReservations = useGetReservations();
  const { auth } = useAuthContext();

  return useQuery({
    queryKey: ['reservations', auth?.userId ?? null, params],
    queryFn: () => getReservations(params),
    enabled: (options?.enabled ?? true) && !!auth,
    placeholderData: keepPreviousData,
  });
};

export default useReservationsQuery;
