import { IUpdateAnotation } from '../../../utils/interfaces/anotations';
import useAxios from '../axios/useAxios';

const useUpdateAnotation = () => {
  const axios = useAxios();

  const updateAnotation = async (
    anotationId: string,
    updatedAnotation: IUpdateAnotation
  ) => {
    const UPDATE_ANOTATION_URL = `/api/v1/annotations/${anotationId}`;

    await axios.put(UPDATE_ANOTATION_URL, updatedAnotation);
  };

  return updateAnotation;
};

export default useUpdateAnotation;
