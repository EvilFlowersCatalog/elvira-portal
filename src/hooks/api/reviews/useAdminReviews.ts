import { keepPreviousData, useQuery } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { IAdminReviewList, ReviewState } from '../../../utils/interfaces/review';

export interface IAdminReviewQuery {
  page: number;
  limit: number;
  query?: string;
  state?: ReviewState | '';
  rating?: string;
  orderBy?: string;
}

/** `GET /api/v1/reviews`: reviews across the catalog's entries, for moderators. */
const useAdminReviews = (q: IAdminReviewQuery) => {
  const api = useAxios();
  return useQuery({
    queryKey: ['admin-reviews', q],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = {
        catalog_id: import.meta.env.ELVIRA_CATALOG_ID,
        page: q.page,
        limit: q.limit,
      };
      if (q.query) params.query = q.query;
      if (q.state) params.state = q.state;
      if (q.rating) params.rating = q.rating;
      if (q.orderBy) params.order_by = q.orderBy;
      const { data } = await api.get<IAdminReviewList>('/api/v1/reviews', { params });
      return data;
    },
  });
};

export default useAdminReviews;
