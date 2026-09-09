import { IListAnitationItem } from '../../../../utils/interfaces/anotations';
import useAxios from '../../useAxios';

const useGetAnotationItem = () => {
  const axios = useAxios();

  /**
   * `page` is the PDF page (`page_number` filter) — pass null to list every
   * item of the annotation. `pagination` drives the API's own paging, which
   * uses the unrelated `page`/`limit` params.
   */
  const getAnotationItem = async (
    anotationId: string,
    page?: number | null,
    pagination?: { page?: number; limit?: number }
  ): Promise<IListAnitationItem> => {
    const GET_ANOTATION_ITEMS_URL = `/api/v1/annotation-items`;

    const params = new URLSearchParams();
    params.set('annotation_id', anotationId);
    if (page != null) params.set('page_number', page.toString());
    if (pagination?.page) params.set('page', pagination.page.toString());
    if (pagination?.limit) params.set('limit', pagination.limit.toString());

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
