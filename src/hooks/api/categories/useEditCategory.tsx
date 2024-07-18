import { ICategoryNew } from '../../../utils/interfaces/category';
import useAxios from '../axios/useAxios';

const useEditCategory = () => {
  const axios = useAxios();

  const editCategory = async (id: string, category: ICategoryNew) => {
    const EDIT_CATEGORY_URL = `/api/v1/categories/${id}`;

    await axios.put(EDIT_CATEGORY_URL, category);
  };

  return editCategory;
};

export default useEditCategory;
