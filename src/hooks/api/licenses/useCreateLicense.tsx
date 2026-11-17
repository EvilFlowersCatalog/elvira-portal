import { DurationValidation, ILicense, INewLicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';
import { withLoanResult } from '../../../lib/analytics';

const useCreateLicense = () => {
    const axios = useAxios();

    const createLicense = async (licenseData: INewLicense): Promise<ILicense> => {
        
        if (!DurationValidation.test(licenseData.duration))
            throw new Error('Invalid duration format. Use ISO 8601 duration, e.g. "P1Y2M10DT2H30M"');
        
        const POST_LICENCES_URL = '/readium/v1/licenses';
        // `loan.result` in Faro (#59): a borrow can fail without the reader noticing.
        const { data } = await withLoanResult('borrow', () =>
            axios.post<{ response: ILicense }>(POST_LICENCES_URL, {
                entry_id: licenseData.entry_id,
                state: licenseData.state,
                duration: licenseData.duration,
                starts_at: licenseData.starts_at,
            }),
        );

        return data.response;
    };

    return createLicense;
};

export default useCreateLicense;
