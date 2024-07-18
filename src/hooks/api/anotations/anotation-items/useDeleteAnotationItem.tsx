import useAxios from '../../axios/useAxios';

const useDeleteAnotationItem = () => {
  const axios = useAxios();

  const deleteAnotationItem = async (id: string) => {
    const DELETE_ANOTATION_ITEM_URL = `/api/v1/annotation-items/${id}`;

    await axios.delete(DELETE_ANOTATION_ITEM_URL);
  };

  return deleteAnotationItem;
};

export default useDeleteAnotationItem;
