import { IEntryDetail } from '../../../utils/interfaces/entry';
import { ILicense } from '../../../utils/interfaces/license';
import useAuthContext from '../../contexts/useAuthContext';
import { queryClient } from '@/lib/reactQuery';
import { entryDetailQuery, entryLicenseQuery } from './entryQueries';

export interface IEntryWithLicense {
  entry: IEntryDetail;
  activeLicense: ILicense | null;
}

/**
 * Imperative access to a publication for event handlers. Goes through the shared cache
 * (`entryQueries`), so a detail already shown or prefetched costs no request.
 */
const useGetEntryDetail = () => {
  const authContext = useAuthContext();

  // `fresh`: always ask the catalog (an edit form, availability), and refresh the cache with the answer.
  const getEntryDetail = (entryId: string, catalogId?: string, options?: { fresh?: boolean }): Promise<IEntryDetail> =>
    queryClient.fetchQuery({ ...entryDetailQuery(entryId, catalogId), ...(options?.fresh ? { staleTime: 0 } : {}) });

  // The detail and the reader's live loan, in parallel; a failed licence lookup is "no loan".
  const getEntryDetailWithLicense = async (entryId: string, catalogId?: string): Promise<IEntryWithLicense> => {
    const [entry, activeLicense] = await Promise.all([
      getEntryDetail(entryId, catalogId),
      queryClient.fetchQuery(entryLicenseQuery(entryId, authContext.auth?.userId)).catch(() => null),
    ]);
    return { entry, activeLicense };
  };

  return { getEntryDetail, getEntryDetailWithLicense };
};

export default useGetEntryDetail;
