import {
  ICategoryQuery,
  IListCategory,
} from '../../../utils/interfaces/category';
import useAxios from '../useAxios';
import useAppContext from '../../contexts/useAppContext';

const useGetCategories = () => {
  const axios = useAxios();
  const { selectedCatalogId } = useAppContext();

  const getCategory = async ({
    page,
    limit,
    query,
    orderBy,
    paginate = false,
  }: ICategoryQuery): Promise<IListCategory> => {
    const GET_CATEGORIES_URL = '/api/v1/categories';

    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    if (selectedCatalogId) params.set('catalog_id', selectedCatalogId);
    if (orderBy) params.set('order_by', orderBy);

    if (query) params.set('query', query);
    params.set('paginate', paginate.toString());

    const { data } = await axios.get<IListCategory>(GET_CATEGORIES_URL, {
      params,
    });

    return data;
  };

  return getCategory;
};

export default useGetCategories;
