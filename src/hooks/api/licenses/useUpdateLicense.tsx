import { ILicense, InterfaceAction, LICENSE_ACTION } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';
import { withLoanResult } from '../../../lib/analytics';

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

        const put = () => axios.put<ILicense>(UPDATE_LICENCES_URL, payload);
        // A reader's return reports `loan.result` in Faro (#59); other actions (admin, renew) don't.
        const { data } = action === LICENSE_ACTION.returned ? await withLoanResult('return', put) : await put();
        return data;
    };

    return updateLicenseState;
};

export default useUpdateLicenseState;
