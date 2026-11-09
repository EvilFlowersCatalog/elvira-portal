import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useAxios from '../useAxios';
import { IReview, IReviewForm, IReviewList, ReviewOrder, ReviewState } from '../../../utils/interfaces/review';

/** Ratings and reviews of an entry (catalog IP-023): `/api/v1/entries/{id}/reviews`. */

const PAGE_SIZE = 10;

export const reviewKeys = {
  all: (entryId: string) => ['entry-reviews', entryId] as const,
  list: (entryId: string, order: ReviewOrder, state: ReviewState | 'all') =>
    ['entry-reviews', entryId, 'list', order, state] as const,
  mine: (entryId: string, userId: string | undefined) => ['entry-reviews', entryId, 'mine', userId] as const,
};

/** Published reviews (or, for moderators, hidden / all), a page at a time. */
export const useEntryReviewList = (entryId: string, order: ReviewOrder, state: ReviewState | 'all') => {
  const api = useAxios();
  return useInfiniteQuery({
    queryKey: reviewKeys.list(entryId, order, state),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: PAGE_SIZE, order_by: order };
      if (state !== 'published') params.state = state;
      const { data } = await api.get<IReviewList>(`/api/v1/entries/${entryId}/reviews`, { params });
      return data;
    },
    getNextPageParam: (last) => (last.metadata.page < last.metadata.pages ? last.metadata.page + 1 : undefined),
  });
};

/** The caller's own review, null without one. Disabled for anonymous users. */
export const useMyReview = (entryId: string, userId: string | undefined) => {
  const api = useAxios();
  return useQuery({
    queryKey: reviewKeys.mine(entryId, userId),
    enabled: !!userId,
    queryFn: async (): Promise<IReview | null> => {
      try {
        const { data } = await api.get<{ response: IReview }>(`/api/v1/entries/${entryId}/reviews/mine`);
        return data.response;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
  });
};

export const useReviewMutations = (entryId: string, onChanged?: () => void) => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: reviewKeys.all(entryId) });
    onChanged?.();
  };

  const save = useMutation({
    mutationFn: async (form: IReviewForm) => {
      const { data } = await api.put<{ response: IReview }>(`/api/v1/entries/${entryId}/reviews/mine`, form);
      return data.response;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/entries/${entryId}/reviews/mine`);
    },
    onSuccess: invalidate,
  });

  const moderate = useMutation({
    mutationFn: async ({ reviewId, state, note }: { reviewId: string; state: ReviewState; note?: string }) => {
      const body: Record<string, string> = { state };
      if (note !== undefined) body.moderation_note = note;
      const { data } = await api.patch<{ response: IReview }>(`/api/v1/reviews/${reviewId}`, body);
      return data.response;
    },
    onSuccess: invalidate,
  });

  return { save, remove, moderate };
};

/** The API's problem-detail message for a failed request, if it has one. */
export const apiErrorMessage = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as
    | { title?: string; detail?: string; validation_errors?: { message?: string }[] }
    | undefined;
  if (!data) return null;
  return data.validation_errors?.[0]?.message || data.detail || data.title || null;
};
