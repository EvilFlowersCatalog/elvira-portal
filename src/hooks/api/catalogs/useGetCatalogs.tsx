import { ICatalogsList } from '../../../utils/interfaces/catalog';
import useAxios from '../useAxios';

const useGetCatalogs = () => {
  const axios = useAxios();

  const getCatalogs = async (): Promise<ICatalogsList> => {
    const GET_CATALOGS_URL = '/api/v1/catalogs';
    const { data: catalogs } = await axios.get<ICatalogsList>(GET_CATALOGS_URL);
    return catalogs;
  };

  return getCatalogs;
};

export default useGetCatalogs;
