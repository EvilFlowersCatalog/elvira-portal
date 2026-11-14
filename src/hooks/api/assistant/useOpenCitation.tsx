import { useSearchParams } from 'react-router-dom';
import { IAssistantCitation } from '../../../utils/interfaces/assistant';
import useGetEntryDetail from '../entries/useGetEntryDetail';
import useOpenInViewer, { IViewerTarget } from './useOpenInViewer';

/** The spot on the page a citation points to (IP-030 Phase 1), if the catalog sent one. */
export const citationTarget = (citation: IAssistantCitation): IViewerTarget | undefined =>
  citation.bbox || citation.quads?.length
    ? {
        paragraphId: citation.paragraph_id,
        regionId: citation.region_id,
        bbox: citation.bbox,
        quads: citation.quads,
        quadsPage:
          citation.sentence_page && citation.sentence_page !== citation.page ? citation.sentence_page : undefined,
      }
    : undefined;

/**
 * Opens an evidence citation (`[E3]`, `[F2]`, IP-024 / IP-030): an open-access publication in the viewer at the
 * cited page and paragraph, a Readium LCP one (borrowed, never opened here) as its detail.
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
    openInViewer(
      { entryId: citation.entry_id, catalogId: entry?.catalog_id, title: citation.title },
      citation.page,
      citationTarget(citation),
    );
  };
};

export default useOpenCitation;
