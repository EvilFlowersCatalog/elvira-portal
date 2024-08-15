import { IDENTIFIERS_TYPE } from '../../../utils/interfaces/general/general';
import useAxios from '../useAxios';
import { IEntryInfo } from '../../../utils/interfaces/entry';

const useGetData = () => {
  const axios = useAxios();

  const getData = async (
    driver: IDENTIFIERS_TYPE,
    identifier: string
  ): Promise<IEntryInfo> => {
    const encodedIdentifier = encodeURIComponent(identifier);
    const params = {
      driver,
      identifier: encodedIdentifier,
    };
    const { data: entryInfo } = await axios.get('/api/v1/entry-introspection', {
      params,
    });

    return entryInfo as IEntryInfo;
  };

  return getData;
};

export default useGetData;
