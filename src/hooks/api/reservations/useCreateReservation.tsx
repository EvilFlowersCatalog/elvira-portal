import { IReservation } from '../../../utils/interfaces/reservation';
import useAxios from '../useAxios';

/**
 * Join the queue for a fully-borrowed entry.
 *
 * The backend queue is declarative: POST /readium/v1/reservations with the
 * entry id. It 409s if the caller already holds a licence or a non-terminal
 * reservation for the entry, or is over the per-user reservation cap — the RFC
 * 7807 `detail` explains which, so callers should surface it.
 */
const useCreateReservation = () => {
  const axios = useAxios();

  const createReservation = async (entryId: string): Promise<IReservation> => {
    const { data } = await axios.post<{ response: IReservation } & Partial<IReservation>>(
      '/readium/v1/reservations',
      { entry_id: entryId },
    );
    return data.response ?? (data as IReservation);
  };

  return createReservation;
};

export default useCreateReservation;
