import { useQueryClient } from '@tanstack/react-query';
import { ICategory } from '../../../utils/interfaces/category';
import useAxios from '../useAxios';

/** Query key of one category's detail, as `useCachedCategoryDetail` caches it. */
export const categoryDetailKey = (categoryId: string) => ['category-detail', categoryId] as const;

/** How long a cached category label is reused before it is fetched again. */
const LABEL_STALE_MS = 5 * 60 * 1000;

const useGetCategoryDetail = () => {
  const axios = useAxios();

  const getCategoryDetail = async (category_id: string): Promise<ICategory> => {
    const CATEGORY_DETAIL_URL = `/api/v1/categories/${category_id}`;
    const { data: categoryDetail } = await axios.get<{ response: ICategory }>(CATEGORY_DETAIL_URL);

    return categoryDetail.response;
  };

  return getCategoryDetail;
};

/**
 * The same request through React Query, so the breadcrumb does not fetch a category's label again on
 * every filter change. Edits invalidate it (`useEditCategory`).
 */
export const useCachedCategoryDetail = () => {
  const queryClient = useQueryClient();
  const getCategoryDetail = useGetCategoryDetail();

  return (categoryId: string): Promise<ICategory> =>
    queryClient.fetchQuery({
      queryKey: categoryDetailKey(categoryId),
      queryFn: () => getCategoryDetail(categoryId),
      staleTime: LABEL_STALE_MS,
    });
};

export default useGetCategoryDetail;
