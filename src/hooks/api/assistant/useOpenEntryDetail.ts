import { useSearchParams } from 'react-router-dom';

/**
 * Opens a publication's detail dialog over the current page, with the same query params as EntryItem's
 * openEntryDetail (the detail needs its catalog: pass it when known).
 */
const useOpenEntryDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (entryId: string, catalogId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('entry-detail-id', entryId);
    params.set('entry-catalog-id', catalogId);
    params.set('dialog-priority', 'entry-detail');
    setSearchParams(params);
  };
};

export default useOpenEntryDetail;
