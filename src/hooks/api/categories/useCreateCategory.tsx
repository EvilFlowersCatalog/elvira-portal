import { ICategoryNew } from '../../../utils/interfaces/category';
import useAxios from '../axios/useAxios';

const useCreateCategory = () => {
  const axios = useAxios();

  const createCategory = async (category: ICategoryNew) => {
    const CREATE_CATEGORY_URL = '/api/v1/categories';

    await axios.post(CREATE_CATEGORY_URL, category);
  };

  return createCategory;
};

export default useCreateCategory;
