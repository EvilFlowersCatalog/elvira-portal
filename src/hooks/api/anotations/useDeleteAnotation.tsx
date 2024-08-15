import useAxios from '../useAxios';

const useDeleteAnotation = () => {
  const axios = useAxios();

  const deleteAnotation = async (id: string) => {
    const DELETE_ANOTATION_URL = `/api/v1/annotations/${id}`;

    await axios.delete(DELETE_ANOTATION_URL);
  };

  return deleteAnotation;
};

export default useDeleteAnotation;
