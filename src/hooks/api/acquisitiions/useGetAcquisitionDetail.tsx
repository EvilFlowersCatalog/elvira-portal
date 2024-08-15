import { IAcquisitionDetail } from '../../../utils/interfaces/acquisition';
import useAxios from '../useAxios';

const useGetAcquisitionDetail = () => {
  const axios = useAxios();

  const getAcquisitionDetail = async (
    acquisitionId: string
  ): Promise<IAcquisitionDetail> => {
    // Get acquistion detail
    const ACQUISITION_DETAIL_URL = `/api/v1/acquisitions/${acquisitionId}`;
    const { data: acquisitionDetail } = await axios.get<IAcquisitionDetail>(
      ACQUISITION_DETAIL_URL
    );

    return acquisitionDetail;
  };

  return getAcquisitionDetail;
};

export default useGetAcquisitionDetail;
