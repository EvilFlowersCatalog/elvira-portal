import {
  ICategoryQuery,
  IListCategory,
} from '../../../utils/interfaces/category';
import useAxios from '../useAxios';

const useGetCategories = () => {
  const axios = useAxios();

  const getCategory = async ({
    page,
    limit,
    query,
    orderBy,
  }: ICategoryQuery): Promise<IListCategory> => {
    const GET_CATEGORIES_URL = '/api/v1/categories';

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);
    params.set('order_by', orderBy);

    if (query) params.set('query', query);

    const { data } = await axios.get<IListCategory>(GET_CATEGORIES_URL, {
      params,
    });

    return data;
  };

  return getCategory;
};

export default useGetCategories;
