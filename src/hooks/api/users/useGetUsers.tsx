import { Metadata } from '../../../utils/interfaces/general/general';
import { IUser } from '../../../utils/interfaces/user';
import useAxios from '../useAxios';

export interface IUserListParams {
    id?: string;
    /** Case-insensitive substring match on username. */
    username?: string;
    name?: string;
    surname?: string;
    /** Username, first name or surname in one box. */
    query?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    /** Only users with an explicit grant to this catalog. */
    catalog_id?: string;
    last_login_gte?: string;
    last_login_lte?: string;
    page?: number;
    limit?: number;
    /** e.g. 'username' or '-created_at' (maps to backend `order_by`). */
    orderBy?: string;
}

const useGetUsers = () => {
    const axios = useAxios();

    const getUsers = async (options: IUserListParams): Promise<{ items: IUser[]; metadata: Metadata }> => {
        const params = new URLSearchParams();

        if (options.page) {
            params.set('page', options.page.toString());
            params.set('limit', (options.limit ?? 10).toString());
        } else {
            params.set('paginate', 'false');
        }

        if (options.username) params.set('username', options.username);
        if (options.name) params.set('name', options.name);
        if (options.surname) params.set('surname', options.surname);
        if (options.query) params.set('query', options.query);
        if (options.is_active !== undefined) params.set('is_active', String(options.is_active));
        if (options.is_superuser !== undefined) params.set('is_superuser', String(options.is_superuser));
        if (options.catalog_id) params.set('catalog_id', options.catalog_id);
        if (options.last_login_gte) params.set('last_login_gte', options.last_login_gte);
        if (options.last_login_lte) params.set('last_login_lte', options.last_login_lte);
        // Backend expects `order_by` (not `sortBy`).
        if (options.orderBy) params.set('order_by', options.orderBy);

        const { data } = await axios.get<{ items: IUser[]; metadata: Metadata }>(
            '/api/v1/users',
            { params }
        );

        return { items: data.items, metadata: data.metadata };
    };

    return getUsers;
};

export default useGetUsers;
