import { ILicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

const useDownloadLicense = () => {
    const axios = useAxios();

    const resolveDownloadUrl = async (license: Pick<ILicense, 'id'> & { download_url?: string }): Promise<string> => {
        if (license.download_url) return license.download_url;

        const { data } = await axios.get<{ response?: ILicense } & Partial<ILicense>>(
            `/readium/v1/licenses/${license.id}`,
        );
        const fresh = data.response ?? (data as ILicense);
        if (!fresh.download_url) {
            throw new Error('License response is missing a download_url');
        }
        return fresh.download_url;
    };

    const openInThorium = async (license: Pick<ILicense, 'id'> & { download_url?: string }): Promise<void> => {
        const url = await resolveDownloadUrl(license);
        const thorium = url.replace(/^https?:\/\//, 'thorium://');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = thorium;
        setTimeout(() => document.body.removeChild(iframe), 5000);
    };

    const downloadDirect = async (license: Pick<ILicense, 'id'> & { download_url?: string }): Promise<void> => {
        const url = await resolveDownloadUrl(license);
        window.location.href = url;
    };

    return { openInThorium, downloadDirect };
};

export default useDownloadLicense;
