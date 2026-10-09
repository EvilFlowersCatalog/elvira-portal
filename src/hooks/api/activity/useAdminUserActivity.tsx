import { IActivityList } from '../../../utils/interfaces/activity';
import useAxios from '../useAxios';

interface IAdminActivityQuery {
  userId: string;
  page: number;
  limit: number;
  orderBy?: string;
}

/** Thrown when the API ignored `user_id` and answered with somebody else's history. */
export class ActivityUnsupportedError extends Error {}

/** Another user's activity history — administrators only. */
const useAdminUserActivity = () => {
  const axios = useAxios();

  return async ({ userId, page, limit, orderBy }: IAdminActivityQuery): Promise<IActivityList> => {
    const params = new URLSearchParams({
      user_id: userId,
      page: String(page),
      limit: String(limit),
      order_by: orderBy || '-last_occurred_at',
    });
    const { data } = await axios.get<IActivityList>('/api/v1/activity', { params });

    // A catalog without the `user_id` filter silently returns the caller's own
    // history. Never present that as this user's activity.
    if (data.items.some((item) => item.user_id !== userId)) throw new ActivityUnsupportedError();

    return data;
  };
};

export default useAdminUserActivity;
