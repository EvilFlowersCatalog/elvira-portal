import { ILicense, InterfaceAction } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useUpdateLicenseState = () => {
    const axios = useAxios();

    const updateLicenseState = async (
        license_id: string,
        action: InterfaceAction,
        requested_end?: string,
    ): Promise<ILicense> => {
        const UPDATE_LICENCES_URL = `/readium/v1/licenses/${license_id}`;
        const payload: { action: InterfaceAction; requested_end?: string } = { action };
        if (requested_end) payload.requested_end = requested_end;

        const { data } = await axios.put<ILicense>(UPDATE_LICENCES_URL, payload);
        return data;
    };

    return updateLicenseState;
};

export default useUpdateLicenseState;
