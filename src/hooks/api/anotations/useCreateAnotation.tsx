import { IAnotation, IAnotationNew } from '../../../utils/interfaces/anotations';
import useAxios from '../useAxios';

const useCreateAnotation = () => {
  const axios = useAxios();

  const createAnotation = async (anotation: IAnotationNew): Promise<IAnotation> => {
    const CREATE_ANOTATION_URL = '/api/v1/annotations';

    const { data } = await axios.post<{ response: IAnotation }>(CREATE_ANOTATION_URL, anotation);

    return data.response;
  };

  return createAnotation;
};

export default useCreateAnotation;
