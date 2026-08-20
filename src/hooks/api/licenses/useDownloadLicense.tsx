import { ILicense } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';

type LicenseRef = Pick<ILicense, 'id'> & { download_url?: string };

const useDownloadLicense = () => {
    const axios = useAxios();

    // The capability token embedded in `download_url` is single-use and expires
    // after ~60s, so a URL captured when the list was rendered is stale by the
    // time anyone clicks it. Always re-fetch the license to mint a fresh one.
    const resolveDownloadUrl = async (license: LicenseRef): Promise<string> => {
        const { data } = await axios.get<{ response?: ILicense } & Partial<ILicense>>(
            `/readium/v1/licenses/${license.id}`,
        );
        const fresh = data.response ?? (data as ILicense);
        if (!fresh.download_url) {
            throw new Error('License response is missing a download_url');
        }
        // The API may hand back a relative path; resolve it against the API
        // origin so it never resolves against the portal's own origin.
        return new URL(fresh.download_url, axios.defaults.baseURL ?? window.location.origin).toString();
    };

    const openInThorium = async (license: LicenseRef): Promise<void> => {
        const url = await resolveDownloadUrl(license);
        const thorium = url.replace(/^https?:\/\//, 'thorium://');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = thorium;
        setTimeout(() => document.body.removeChild(iframe), 5000);
    };

    const downloadDirect = async (license: LicenseRef): Promise<void> => {
        const url = await resolveDownloadUrl(license);
        window.location.href = url;
    };

    return { openInThorium, downloadDirect };
};

export default useDownloadLicense;
