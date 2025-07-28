import { ILicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useDownloadLicense = () => {
    const axios = useAxios();

    const downloadLicense = async (license_id: string): Promise<void> => {
        const GET_LICENCES_URL = `/readium/v1/licenses/${license_id}.lcpl`;
        const { data } = await axios.get(GET_LICENCES_URL, { responseType: 'blob' });

        // Create a URL for the blob and trigger download
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${license_id}.lcpl`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return downloadLicense;
};

export default useDownloadLicense;

