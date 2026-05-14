import useAxios from '../useAxios';

const useCancelReservation = () => {
  const axios = useAxios();

  const cancelReservation = async (reservationId: string): Promise<void> => {
    await axios.patch(`/readium/v1/reservations/${reservationId}`, { status: 'cancelled' });
  };

  return cancelReservation;
};

export default useCancelReservation;
