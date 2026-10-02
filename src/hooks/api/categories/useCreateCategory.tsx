import { ICategoryNew } from '../../../utils/interfaces/category';
import useAxios from '../useAxios';

const useCreateCategory = () => {
  const axios = useAxios();

  const createCategory = async (category: ICategoryNew) => {
    const CREATE_CATEGORY_URL = '/api/v1/categories';

    const { data } = await axios.post<{ response?: { id?: string }; id?: string } | undefined>(CREATE_CATEGORY_URL, category);
    return data;
  };

  return createCategory;
};

export default useCreateCategory;
