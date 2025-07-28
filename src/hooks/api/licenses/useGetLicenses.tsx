import { ILanguage } from '../../../utils/interfaces/language';
import { ILicense } from '../../../utils/interfaces/license';
import useAuthContext from '../../contexts/useAuthContext';
import useAxios from '../useAxios';

const useGetLicenses = () => {
    const axios = useAxios();
    const authContext = useAuthContext();

    const getLicenses = async (): Promise<ILicense[]> => {
        const params = new URLSearchParams();

        params.set('user_id', authContext.auth?.userId || '');

        const GET_LICENCES_URL = '/readium/v1/licenses';
        const { data } = await axios.get<{ items: ILicense[] }>(GET_LICENCES_URL, { params });

        return data.items;
    };

    return getLicenses;
};

export default useGetLicenses;
