import { IListAnitationItem } from '../../../../utils/interfaces/anotations';
import useAxios from '../../useAxios';

const useGetAnotationItem = () => {
  const axios = useAxios();

  const getAnotationItem = async (
    anotationId: string,
    page: number
  ): Promise<IListAnitationItem> => {
    const GET_ANOTATION_ITEMS_URL = `/api/v1/annotation-items`;

    const params = new URLSearchParams();
    params.set('annotation_id', anotationId);
    params.set('page_number', page.toString());

    const { data: anotationItems } = await axios.get<IListAnitationItem>(
      GET_ANOTATION_ITEMS_URL,
      {
        params,
      }
    );

    return anotationItems;
  };

  return getAnotationItem;
};

export default useGetAnotationItem;
