import useAxios from '../useAxios';

const useDeleteUser = () => {
  const axios = useAxios();

  return async (userId: string): Promise<void> => {
    await axios.delete(`/api/v1/users/${userId}`);
  };
};

export default useDeleteUser;
