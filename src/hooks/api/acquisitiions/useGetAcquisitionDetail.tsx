import { IAcquisitionDetail } from '../../../utils/interfaces/acquisition';
import useAxios from '../useAxios';

const useGetAcquisitionDetail = () => {
  const axios = useAxios();

  const getAcquisitionDetail = async (
    acquisitionId: string
  ): Promise<IAcquisitionDetail> => {
    // Get acquistion detail
    const ACQUISITION_DETAIL_URL = `/api/v1/acquisitions/${acquisitionId}`;
    const { data: acquisitionDetail } = await axios.get<{response: IAcquisitionDetail}>(ACQUISITION_DETAIL_URL);

    return acquisitionDetail.response;
  };

  return getAcquisitionDetail;
};

export default useGetAcquisitionDetail;
