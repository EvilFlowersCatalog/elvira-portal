import useAxios from '../useAxios';
import { LICENSE_ACTION } from '../../../utils/interfaces/licenses';

const useCancelReservation = () => {
  const axios = useAxios();

  const cancelReservation = async (licenseId: string): Promise<void> => {
    await axios.put(`/readium/v1/licenses/${licenseId}`, { action: LICENSE_ACTION.cancelled });
  };

  return cancelReservation;
};

export default useCancelReservation;
