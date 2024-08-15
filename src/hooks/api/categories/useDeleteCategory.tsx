import useAxios from '../useAxios';

const useDeleteCategory = () => {
  const axios = useAxios();

  const deleteCategory = async (categoryId: string) => {
    const DELETE_CATEGORY_URL = `/api/v1/categories/${categoryId}`;

    await axios.delete(DELETE_CATEGORY_URL);
  };

  return deleteCategory;
};

export default useDeleteCategory;
