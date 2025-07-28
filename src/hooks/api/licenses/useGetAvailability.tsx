import { ILanguage } from '../../../utils/interfaces/language';
import { ILicense } from '../../../utils/interfaces/license';
import useAuthContext from '../../contexts/useAuthContext';
import useAxios from '../useAxios';

const useGetAvailability = () => {
    const axios = useAxios();

    const getAvailability = async (entry_id:string): Promise<any> => {
        const GET_AVAILABILITY_URL = `/readium/v1/entries/${entry_id}/availability`;

        const { data } = await axios.get<any >(GET_AVAILABILITY_URL);

        return data;
    };

    return getAvailability;
};

export default useGetAvailability;
