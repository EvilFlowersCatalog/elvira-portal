import { IListAnitation } from '../../../utils/interfaces/anotations';
import useAxios from '../axios/useAxios';

const useGetAnotations = () => {
  const axios = useAxios();

  const getAnotations = async (
    userAcquisitionId: string
  ): Promise<IListAnitation> => {
    const params = new URLSearchParams();
    params.set('user_acquisition_id', userAcquisitionId);

    const GET_ANOTATIONS_URL = '/api/v1/annotations';

    const { data: anotations } = await axios.get<IListAnitation>(
      GET_ANOTATIONS_URL,
      { params }
    );

    return anotations;
  };

  return getAnotations;
};

export default useGetAnotations;
