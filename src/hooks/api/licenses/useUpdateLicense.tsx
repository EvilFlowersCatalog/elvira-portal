import { DurationValidation, ILicense, InterfaceState } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useUpdateLiceseState = () => {
    const axios = useAxios();

    const updateLicenseState = async (license_id:string, state: InterfaceState, duration: string): Promise<ILicense> => {
        const params = new URLSearchParams();

        if (!DurationValidation.test(duration)) 
            throw new Error('Invalid duration format. Use ISO 8601 duration, e.g. "P1Y2M10DT2H30M"');

        params.set('state', state);
        params.set('duration', duration);

        const UPDATE_LICENCES_URL = `/readium/v1/licenses/${license_id}`;
        const { data } = await axios.put<ILicense>(UPDATE_LICENCES_URL, { params });

        return data;
    };

    return updateLicenseState;
};

export default useUpdateLiceseState;
