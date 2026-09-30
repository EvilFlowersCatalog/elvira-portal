import { IActivityList } from '../../../utils/interfaces/activity';
import useAxios from '../useAxios';

interface IActivityQuery {
  page: number;
  limit: number;
}

const useGetActivity = () => {
  const axios = useAxios();

  const getActivity = async ({ page, limit }: IActivityQuery): Promise<IActivityList> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('catalog_id', import.meta.env.ELVIRA_CATALOG_ID);
    params.set('order_by', '-last_occurred_at');

    const ACTIVITY_URL = '/api/v1/activity';
    const { data } = await axios.get<IActivityList>(ACTIVITY_URL, { params });

    return data;
  };

  return getActivity;
};

export default useGetActivity;
