import { IUserAcquisitionResponse } from '../../../../utils/interfaces/acquisition';
import useAxios from '../../useAxios';

/**
 * The user acquisition's record (not its file): `GET /api/v1/user-acquisitions/<id>`. The reader asks
 * for it again when its signed `stream_url` has expired mid-read (elvira-portal#63).
 */
const useGetUserAcquisitionInfo = () => {
  const axios = useAxios();

  return async (userAcquisitionId: string): Promise<IUserAcquisitionResponse> => {
    const { data } = await axios.get<{ response: IUserAcquisitionResponse }>(
      `/api/v1/user-acquisitions/${userAcquisitionId}`,
    );
    return data.response;
  };
};

export default useGetUserAcquisitionInfo;
