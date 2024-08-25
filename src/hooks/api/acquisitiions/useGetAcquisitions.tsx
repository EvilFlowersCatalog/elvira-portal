import { AxiosResponse } from 'axios';
import {
  IAcquisitionList,
  IAcquisitionQuery,
} from '../../../utils/interfaces/acquisition';
import useAxios from '../useAxios';

const useGetAcquisitions = () => {
  const axios = useAxios();

  const getAcquisitions = async ({
    entry_id,
    relation,
    mime,
  }: IAcquisitionQuery): Promise<IAcquisitionList> => {
    const GET_ACQUISITION_URL = '/api/v1/acquisitions';

    const params = new URLSearchParams();
    if (entry_id) params.set('entry_id', entry_id);
    if (relation) params.set('relation', relation);
    if (mime) params.set('mime', mime);

    const { data: acquisitionList } = await axios.get<IAcquisitionList>(
      GET_ACQUISITION_URL,
      { params }
    );

    return acquisitionList;
  };

  return getAcquisitions;
};

export default useGetAcquisitions;
