import { ICategory } from '../../../utils/interfaces/category';
import useAxios from '../useAxios';

const useGetCategoryDetail = () => {
  const axios = useAxios();

  const getCategoryDetail = async (category_id: string): Promise<ICategory> => {
    const CATEGORY_DETAIL_URL = `/api/v1/categories/${category_id}`;
    const { data: categoryDetail } = await axios.get<{ response: ICategory }>(CATEGORY_DETAIL_URL);

    return categoryDetail.response;
  };

  return getCategoryDetail;
};

export default useGetCategoryDetail;
