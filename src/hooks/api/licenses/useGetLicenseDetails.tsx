import { ILicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useGetLicenseDetails = () => {
    const axios = useAxios();

    const getLicenseDetails = async (license_id: string): Promise<ILicense> => {
        const params = new URLSearchParams();

        params.set('license_id', license_id);

        const GET_LICENCE_DETAILS_URL = `/readium/v1/licenses/${license_id}`;
        const { data } = await axios.get<ILicense>(GET_LICENCE_DETAILS_URL, { params });

        return data;
    };

    return getLicenseDetails;
};

export default useGetLicenseDetails;
