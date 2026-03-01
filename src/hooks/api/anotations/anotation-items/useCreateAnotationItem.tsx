import {
  IAnotationItemBody,
  ICreateAnotationItemResponse,
} from '../../../../utils/interfaces/anotations';
import useAxios from '../../useAxios';

const useCreateAnotationItem = () => {
  const axios = useAxios();

  const createAnotationItem = async (
    anotationItem: IAnotationItemBody
  ): Promise<ICreateAnotationItemResponse> => {
    const CREATE_ANNOTATION_ITEM_URL = '/api/v1/annotation-items';
    const { data: info } = await axios.post<{ response: ICreateAnotationItemResponse }>(
      CREATE_ANNOTATION_ITEM_URL,
      anotationItem
    );

    return info.response;
  };

  return createAnotationItem;
};

export default useCreateAnotationItem;
