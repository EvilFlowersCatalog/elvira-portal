import { IAnotationNew } from '../../../utils/interfaces/anotations';
import useAxios from '../axios/useAxios';

const useCreateAnotation = () => {
  const axios = useAxios();

  const createAnotation = async (anotation: IAnotationNew) => {
    const CREATE_ANOTATION_URL = '/api/v1/annotations';

    await axios.post(CREATE_ANOTATION_URL, anotation);
  };

  return createAnotation;
};

export default useCreateAnotation;
