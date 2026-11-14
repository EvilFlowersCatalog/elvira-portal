import { useQueryClient } from '@tanstack/react-query';
import { ICategoryNew } from '../../../utils/interfaces/category';
import useAxios from '../useAxios';
import { categoryDetailKey } from './useGetCategoryDetail';

const useEditCategory = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  const editCategory = async (id: string, category: ICategoryNew) => {
    const EDIT_CATEGORY_URL = `/api/v1/categories/${id}`;

    await axios.put(EDIT_CATEGORY_URL, category);
    // A relabelled category must not keep its old label in the breadcrumb.
    queryClient.invalidateQueries({ queryKey: categoryDetailKey(id) });
  };

  return editCategory;
};

export default useEditCategory;
