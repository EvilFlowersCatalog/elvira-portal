import { ILicense } from '../../../utils/interfaces/license';
import { IReservation, RESERVATION_STATUS } from '../../../utils/interfaces/reservation';
import useAxios from '../useAxios';

/**
 * Mutate a reservation via the declarative endpoint. Only `cancelled` and
 * `claimed` are client-callable; promotion and expiry are server-side.
 *
 * Cancel returns the updated reservation; claim converts an `available`
 * reservation into a real License and returns that License (201).
 */
const useUpdateReservation = () => {
  const axios = useAxios();

  const cancelReservation = async (reservationId: string): Promise<IReservation> => {
    const { data } = await axios.patch<{ response: IReservation } & Partial<IReservation>>(
      `/readium/v1/reservations/${reservationId}`,
      { status: RESERVATION_STATUS.cancelled },
    );
    return data.response ?? (data as IReservation);
  };

  const claimReservation = async (reservationId: string): Promise<ILicense> => {
    const { data } = await axios.patch<{ response: ILicense } & Partial<ILicense>>(
      `/readium/v1/reservations/${reservationId}`,
      { status: RESERVATION_STATUS.claimed },
    );
    return data.response ?? (data as ILicense);
  };

  return { cancelReservation, claimReservation };
};

export default useUpdateReservation;
