import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ICategoryQuery } from '../../../utils/interfaces/category';
import useGetCategories from './useGetCategories';

/**
 * React Query wrapper around the categories endpoint. Every caller that asks for
 * the same list shares one request (the toolbar chips, both advanced-search
 * sidebars). The UI language is part of the key because it is a request param.
 */
const useCategoriesQuery = (
  query: Partial<ICategoryQuery> = { paginate: false },
  options?: { enabled?: boolean }
) => {
  const getCategories = useGetCategories();
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: ['categories', i18n.language, query],
    queryFn: () => getCategories(query as ICategoryQuery),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export default useCategoriesQuery;
