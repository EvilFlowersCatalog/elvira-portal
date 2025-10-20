import { Metadata } from '../../../utils/interfaces/general/general';
import { IMyShelfPostResponse } from '../../../utils/interfaces/my-shelf';
import { IUser } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';

interface IUserParams {
    id?: string;
    username?: string;
    name?: string;
    surname?: string;
    is_active?: boolean;
    last_login_gte?: string;
    last_login_lte?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
}

const useGetUsers = () => {
    const axios = useAxios();

    const addToShelf = async (options: IUserParams): Promise<{items: IUser[], metadata: Metadata}> => {
        const params = new URLSearchParams();

        if (options.page) {
            params.set('page', options.page?.toString() || '1');
            params.set('limit', options.limit?.toString() || '10');
        } else {
            params.set('pagination', 'false');
        }

        if (options.sortBy) {
            params.set('sortBy', options.sortBy);
        }

        const LIST_USERS_URL = '/api/v1/users';
        const { data } = await axios.get<{items: IUser[], metadata: Metadata}>(
            LIST_USERS_URL,
            { params }
        );

        return { items: data.items, metadata: data.metadata };
    };

    return addToShelf;
};

export default useGetUsers;
