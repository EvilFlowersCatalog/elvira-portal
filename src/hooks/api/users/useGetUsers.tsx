import { IUser, IUsersList } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';

const useGetUsers = () => {
  const axios = useAxios();

  const getUsers = async (): Promise<IUsersList>=> {
    const { data: users } = await axios.get('/api/v1/users')   
    return users;
  }

  return getUsers;
}

export default useGetUsers;
