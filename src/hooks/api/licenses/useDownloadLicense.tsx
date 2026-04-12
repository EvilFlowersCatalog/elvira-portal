import useAuth from '../../contexts/useAuthContext';

const useDownloadLicense = () => {
    const { auth } = useAuth();

    const getLicenseUrls = (license_id: string) => {
        const base = import.meta.env.ELVIRA_BASE_URL;
        return {
            thorium: `${base.replace("https://", "thorium://")}/readium/v1/licenses/${license_id}.lcpl?access_token=${auth?.token}`,
            download: `${base}/readium/v1/licenses/${license_id}.lcpl?access_token=${auth?.token}`,
        };
    };

    const openInThorium = (license_id: string): void => {
        const { thorium } = getLicenseUrls(license_id);
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        iframe.src = thorium;
        setTimeout(() => document.body.removeChild(iframe), 5000);
    };

    const downloadDirect = (license_id: string): void => {
        const { download } = getLicenseUrls(license_id);
        window.location.href = download;
    };

    return { openInThorium, downloadDirect };
};

export default useDownloadLicense;
