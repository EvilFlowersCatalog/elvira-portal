import { ILanguageList } from '../../../utils/interfaces/language';
import useAxios from '../useAxios';

const useGetLangauges = () => {
  const axios = useAxios();

  const getLangauges = async (): Promise<ILanguageList> => {
    const GET_LANGUAGES_URL = '/api/v1/languages';
    const { data: langauges } = await axios.get<ILanguageList>(
      GET_LANGUAGES_URL
    );

    return langauges;
  };

  return getLangauges;
};

export default useGetLangauges;
