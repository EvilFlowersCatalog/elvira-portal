import { formatDate } from 'date-fns';
import { IAvailabilityResponse } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useGetAvailability = () => {
    const axios = useAxios();

    const getAvailability = async (startDate: Date, endDate: Date, entry_id: string): Promise<IAvailabilityResponse> => {
        const params = new URLSearchParams();
        params.append('start_date', formatDate(startDate, 'yyyy-MM-dd'));
        params.append('end_date', formatDate(endDate, 'yyyy-MM-dd'));
        const GET_AVAILABILITY_URL = `/readium/v1/entries/${entry_id}/availability`;

        const { data } = await axios.get<{response:IAvailabilityResponse}>(GET_AVAILABILITY_URL, { params });
        // data.response.available = true; // TEMP-BE
        return data.response;
    };

    return getAvailability;
};

export default useGetAvailability;
