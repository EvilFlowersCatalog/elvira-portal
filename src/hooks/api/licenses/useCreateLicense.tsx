import { DurationValidation, ILicense, INewLicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useCreateLicense = () => {
    const axios = useAxios();

    const createLicense = async (licenseData: INewLicense): Promise<ILicense> => {
        const params = new URLSearchParams();

        if (!DurationValidation.test(licenseData.duration))
            throw new Error('Invalid duration format. Use ISO 8601 duration, e.g. "P1Y2M10DT2H30M"');

        params.set('entry_id', licenseData.entry_id);
        params.set('state', licenseData.state);
        params.set('duration', licenseData.duration);
        if (licenseData.starts_at) params.set('starts_at', licenseData.starts_at);

        const POST_LICENCES_URL = '/readium/v1/licenses';
        const { data } = await axios.post<{ items: ILicense }>(POST_LICENCES_URL, { params });

        return data.items;
    };

    return createLicense;
};

export default useCreateLicense;
