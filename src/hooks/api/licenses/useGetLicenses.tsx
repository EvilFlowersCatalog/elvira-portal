import { ILanguage } from '../../../utils/interfaces/language';
import { ILicense } from '../../../utils/interfaces/license';
import useAuthContext from '../../contexts/useAuthContext';
import useAxios from '../useAxios';

interface GetLicensesParams {
    user_mode?: 'all' | 'current' | 'query';
    user_id?: string;
    entry_id?: string;
    pagination?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
}

const useGetLicenses = () => {
    const axios = useAxios();
    const authContext = useAuthContext();

    /**
     * Fetch licenses based on the provided query parameters.
     * @param query The query parameters for fetching licenses.
     * @param query.user_mode The mode for user filtering: 'all', 'current', or 'query'. 'current' uses the authenticated user's ID, 'all' does not filter by user, and 'query' (default) uses the provided user_id.
     * @param query.user_id The user ID to filter licenses by when using 'query' mode.
     * @param query.entry_id The entry ID to filter licenses by.
     * @param query.pagination Whether to enable pagination (default is true).
     * @param query.page The page number for pagination.
     * @param query.limit The number of items per page for pagination.
     * @param query.sortBy The field to sort the results by.
     * @returns A promise that resolves to an object containing the fetched licenses and metadata.
     */
    const getLicenses = async (query: GetLicensesParams): Promise<{ items: ILicense[], metadata: { pages: number, total: number, limit: number, page: number } }> => {
        const params = new URLSearchParams();

        switch (query.user_mode) {
            case 'current':
                params.set('user_id', authContext.auth?.userId || '');
                break;
            case 'all':
                // don't filter 
                break;
            case 'query':
            default:
                params.set('user_id', query.user_id || '');
        }

        params.set('user_id', query.user_id || authContext.auth?.userId || '');
        params.set('entry_id', query.entry_id || '');
        params.set('pagination', query.pagination !== false ? 'true' : 'false');
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

        // TEMP-BE
        return {
            items: [
                {
                    entry_id: 'e0b6bede-d678-4b64-9415-e7243a0489f7',
                    id: 'license-1',
                    state: 'active',
                    created_at: '2023-01-01',
                    expires_at: '2024-01-01',
                    user_id: '',
                    updated_at: '2023-01-01',
                    starts_at: '2023-01-01',
                    lcp_license_id: 'lcp-license-1',
                }
            ],
            metadata: {
                pages: 1,
                total: 1,
                limit: 10,
                page: 1
            }
        };

        return data;
    };

    return getLicenses;
};

export default useGetLicenses;
