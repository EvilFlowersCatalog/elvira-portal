import { useSearchParams } from 'react-router-dom';
import { IAssistantCitation } from '../../../utils/interfaces/assistant';
import useGetEntryDetail from '../entries/useGetEntryDetail';
import useOpenInViewer from './useOpenInViewer';

/**
 * Opens an evidence citation (`[E3]`, IP-024): an open-access publication in the viewer at the cited page,
 * a Readium LCP one (borrowed, never opened here) as its detail.
 */
const useOpenCitation = () => {
  const openInViewer = useOpenInViewer();
  const { getEntryDetail } = useGetEntryDetail();
  const [searchParams, setSearchParams] = useSearchParams();

  return async (citation: IAssistantCitation, onNavigate?: () => void) => {
    const entry = await getEntryDetail(citation.entry_id).catch(() => null);
    onNavigate?.();
    if (entry?.config?.readium_enabled) {
      // Same query params as EntryItem's openEntryDetail.
      const params = new URLSearchParams(searchParams);
      params.set('entry-detail-id', citation.entry_id);
      params.set('entry-catalog-id', entry.catalog_id);
      params.set('dialog-priority', 'entry-detail');
      setSearchParams(params);
      return;
    }
    openInViewer({ entryId: citation.entry_id, catalogId: entry?.catalog_id, title: citation.title }, citation.page);
  };
};

export default useOpenCitation;
