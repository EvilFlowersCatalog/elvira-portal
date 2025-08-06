import { Metadata } from '../../../utils/interfaces/general/general';
import { IUser } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';


const useGetUserDetails = () => {
    const axios = useAxios();

    const addToShelf = async (user_id: string): Promise<IUser> => {
        const LIST_USERS_URL = `/api/v1/users/${user_id}`;
        const { data } = await axios.get<{ response: IUser }>(
            LIST_USERS_URL
        );

        return data.response;
    };

    return addToShelf;
};

export default useGetUserDetails;
