import { IAnotationItemBody } from '../../../../utils/interfaces/anotations';
import useAxios from '../../axios/useAxios';

const useUpdateAnotationItem = () => {
  const axios = useAxios();

  const updateAnotationItem = async (id: string, item: IAnotationItemBody) => {
    const UPDATE_ANOTATION_ITEM = `/api/v1/annotation-items/${id}`;

    await axios.put(UPDATE_ANOTATION_ITEM, item);
  };

  return updateAnotationItem;
};

export default useUpdateAnotationItem;
