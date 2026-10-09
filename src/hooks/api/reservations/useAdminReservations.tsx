import { IReservation, IReservationList, RESERVATION_STATUS } from '../../../utils/interfaces/reservation';
import useAxios from '../useAxios';

export interface IAdminReservationParams {
  page: number;
  limit: number;
  userId?: string;
  /** Entry title or user name. */
  query?: string;
  orderBy?: string;
}

/** Every reservation the administrator may see (`scope=managed`), not only their own queue. */
export const useListAdminReservations = () => {
  const axios = useAxios();
  return async (opts: IAdminReservationParams): Promise<IReservationList> => {
    const params = new URLSearchParams({
      scope: 'managed',
      page: String(opts.page),
      limit: String(opts.limit),
      order_by: opts.orderBy || '-requested_at',
    });
    if (opts.userId) params.set('user_id', opts.userId);
    if (opts.query) params.set('query', opts.query);
    const { data } = await axios.get<IReservationList>('/readium/v1/reservations', { params });
    return data;
  };
};

/** Admin-cancel a queued or available reservation. */
export const useAdminCancelReservation = () => {
  const axios = useAxios();
  return async (id: string): Promise<IReservation> => {
    const { data } = await axios.patch<{ response: IReservation }>(`/readium/v1/reservations/${id}`, {
      status: RESERVATION_STATUS.cancelled,
    });
    return data.response;
  };
};
