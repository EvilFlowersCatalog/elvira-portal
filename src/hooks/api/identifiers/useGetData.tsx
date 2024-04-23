import { IDENTIFIERS_TYPE } from '../../../utils/interfaces/general/general';
import useAxios from '../axios/useAxios';
import { IEntryInfo } from '../../../utils/interfaces/entry';

const useGetData = () => {
  const axios = useAxios();

  const getData = async (driver: IDENTIFIERS_TYPE, identifier: string) => {
    const params = {
      driver,
      identifier: encodeURIComponent(identifier),
    };
    const entryInfo: IEntryInfo = await axios.get(
      '/api/v1/entry-introspection',
      { params }
    );

    return entryInfo;
  };

  return getData;
};

export default useGetData;
