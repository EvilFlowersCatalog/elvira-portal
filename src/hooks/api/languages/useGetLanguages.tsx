import { IEntriesList, IEntryQuery } from '../../../utils/interfaces/entry';
import { ILanguage } from '../../../utils/interfaces/language';
import useAxios from '../useAxios';

const useGetLanguages = () => {
    const axios = useAxios();

    const getLanguages = async (): Promise<ILanguage[]> => {
        const params = new URLSearchParams();
        params.set('limit', "200");

        const GET_LANGUAGES_URL = '/api/v1/languages';
        const { data } = await axios.get<{ items: ILanguage[] }>(GET_LANGUAGES_URL, { params });

        return data.items;
    };

    return getLanguages;
};

export default useGetLanguages;
