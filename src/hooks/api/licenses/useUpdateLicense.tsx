import { DurationValidation, ILicense, InterfaceState } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

/**
 * Hook to update a license state and optionally extend its duration
 * @returns A function that updates the license state
 */
const useUpdateLicenseState = () => {
    const axios = useAxios();

    const updateLicenseState = async (license_id:string, state: InterfaceState, duration?: string): Promise<ILicense> => {
        if (duration && !DurationValidation.test(duration)) 
            throw new Error('Invalid duration format. Use ISO 8601 duration, e.g. "P1Y2M10DT2H30M"');

        const UPDATE_LICENCES_URL = `/readium/v1/licenses/${license_id}`;
        const { data } = await axios.put<ILicense>(UPDATE_LICENCES_URL, { 
            state,
            duration
         });

        return data;
    };

    return updateLicenseState;
};

export default useUpdateLicenseState;
