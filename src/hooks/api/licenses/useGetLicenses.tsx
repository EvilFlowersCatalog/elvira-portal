import { ILanguage } from '../../../utils/interfaces/language';
import { ILicense } from '../../../utils/interfaces/license';
import useAuthContext from '../../contexts/useAuthContext';
import useAxios from '../useAxios';

interface GetLicensesParams {
    user_id?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
}

const useGetLicenses = () => {
    const axios = useAxios();
    const authContext = useAuthContext();

    const getLicenses = async (query: GetLicensesParams): Promise<{ items: ILicense[], metadata: { pages: number, total: number, limit: number, page: number } }> => {
        const params = new URLSearchParams();

        params.set('user_id', query.user_id || authContext.auth?.userId || '');
        params.set('page', query.page?.toString() || '1');
        params.set('limit', query.limit?.toString() || '10');
        params.set('sort_by', query.sortBy || '');

        const GET_LICENCES_URL = '/readium/v1/licenses';
        const { data } = await axios.get<{
            items: ILicense[], metadata: {
                pages: number;
                total: number;
                limit: number;
                page: number;
            }
        }>(GET_LICENCES_URL, { params });

        console.log(data, "expecting results, may be items")

        return data;
    };

    return getLicenses;
};

export default useGetLicenses;
