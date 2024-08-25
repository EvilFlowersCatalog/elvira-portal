import useAxios from '../useAxios';

const useRemoveAcquisition = () => {
  const axios = useAxios();

  const removeAcquisition = async (acquisitionId: string) => {
    const REMOVE_ACQUISITION_URL = `/api/v1/acquisitions/${acquisitionId}`;

    await axios.delete(REMOVE_ACQUISITION_URL);
  };

  return removeAcquisition;
};

export default useRemoveAcquisition;
