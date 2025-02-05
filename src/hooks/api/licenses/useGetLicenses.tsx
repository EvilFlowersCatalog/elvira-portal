import {
  ILicenseList,
  ILicenseQuery,
} from '../../../utils/interfaces/licenses';
import useAxios from '../useAxios';

const useGetLicenses = () => {
  const axios = useAxios();

  const getLicenses = async ({
    page,
    limit,
    user_id,
    entry_id,
    state,
    starts_at__gte,
    starts_at__lte,
    expires_at__gte,
    expires_at__lte,
  }: ILicenseQuery): Promise<ILicenseList> => {
    // Set params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    // Check if there is param, if yes set it
    if (user_id) params.set('user_id', user_id);
    if (entry_id) params.set('entry_id', entry_id);
    if (state) params.set('state', state);
    if (starts_at__gte) params.set('starts_at__gte', starts_at__gte);
    if (starts_at__lte) params.set('starts_at__lte', starts_at__lte);
    if (expires_at__gte) params.set('expires_at__gte', expires_at__gte);
    if (expires_at__lte) params.set('expires_at__lte', expires_at__lte);

    // Get licenses by params
    const GET_LICENSES_URL = '/readium/v1/licenses';
    const { data: licenses } = await axios.get<ILicenseList>(GET_LICENSES_URL, {
      params,
    });

    // Return licenses
    return licenses;
  };

  // Return function
  return getLicenses;
};

export default useGetLicenses;
