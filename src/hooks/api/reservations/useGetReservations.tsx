import { IReservation, IReservationList, RESERVATION_STATUS } from '../../../utils/interfaces/reservation';
import useAxios from '../useAxios';

interface Query {
  page?: number;
  limit?: number;
  status?: RESERVATION_STATUS | RESERVATION_STATUS[];
}

/** Fetch the caller's reservations (real queue rows, entry embedded). */
const useGetReservations = () => {
  const axios = useAxios();

  const getReservations = async (query: Query = {}): Promise<IReservation[]> => {
    const params = new URLSearchParams();
    params.set('paginate', 'true');
    params.set('page', String(query.page ?? 1));
    params.set('limit', String(query.limit ?? 50));
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      params.set('status', statuses.join(','));
    }

    const { data } = await axios.get<IReservationList>(`/readium/v1/reservations?${params.toString()}`);
    return data.items ?? [];
  };

  return getReservations;
};

export default useGetReservations;
