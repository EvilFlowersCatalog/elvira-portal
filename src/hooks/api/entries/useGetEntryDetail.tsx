import { IEntryDetail } from '../../../utils/interfaces/entry';
import { ILicense, LICENSE_STATE } from '../../../utils/interfaces/license';
import useAxios from '../useAxios';
import useAuthContext from '../../contexts/useAuthContext';

export interface IEntryWithLicense {
  entry: IEntryDetail;
  activeLicense: ILicense | null;
}

const useGetEntryDetail = () => {
  const axios = useAxios();
  const authContext = useAuthContext();

  const getEntryDetail = async (entryId: string, catalogId?: string): Promise<IEntryDetail> => {
    const effectiveCatalogId = catalogId || import.meta.env.ELVIRA_CATALOG_ID;
    const ENTRY_DETAIL_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;
    const { data: entryDetail } = await axios.get<{ response: IEntryDetail }>(ENTRY_DETAIL_URL);
    return entryDetail.response;
  };

  // Fetches entry detail and the current user's active/reserved license for it in parallel.
  const getEntryDetailWithLicense = async (entryId: string, catalogId?: string): Promise<IEntryWithLicense> => {
    const effectiveCatalogId = catalogId || import.meta.env.ELVIRA_CATALOG_ID;
    const ENTRY_DETAIL_URL = `/api/v1/catalogs/${effectiveCatalogId}/entries/${entryId}`;

    const licenseParams = new URLSearchParams({
      user_id: authContext.auth?.userId || '',
      entry_id: entryId,
      pagination: 'false',
    });

    const [entryRes, licenseRes] = await Promise.allSettled([
      axios.get<{ response: IEntryDetail }>(ENTRY_DETAIL_URL),
      axios.get<{ items: ILicense[] }>('/readium/v1/licenses', { params: licenseParams }),
    ]);

    if (entryRes.status === 'rejected') throw entryRes.reason;
    const entry = entryRes.value.data.response;

    let activeLicense: ILicense | null = null;
    if (licenseRes.status === 'fulfilled') {
      const now = new Date();
      activeLicense = licenseRes.value.data.items.find((l) => {
        if (l.state === LICENSE_STATE.active) {
          return !l.expires_at || new Date(l.expires_at) > now;
        }
        return (l.state as string) === 'ready' || l.state === LICENSE_STATE.draft;
      }) ?? null;
    }

    return { entry, activeLicense };
  };

  return { getEntryDetail, getEntryDetailWithLicense };
};

export default useGetEntryDetail;
