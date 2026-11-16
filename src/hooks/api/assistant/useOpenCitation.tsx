import { useNavigate } from 'react-router-dom';
import { citePath } from '../../../utils/func/citeLink';
import { IAssistantCitation } from '../../../utils/interfaces/assistant';
import useGetEntryDetail from '../entries/useGetEntryDetail';
import useOpenInViewer, { IViewerTarget } from './useOpenInViewer';
import useOpenEntryDetail from './useOpenEntryDetail';

/** The spot on the page a citation points to (IP-030 Phase 1), if the catalog sent one. */
export const citationTarget = (citation: IAssistantCitation): IViewerTarget | undefined =>
  citation.bbox || citation.quads?.length || citation.region_id
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
  const openEntryDetail = useOpenEntryDetail();
  const navigate = useNavigate();

  return async (citation: IAssistantCitation, onNavigate?: () => void) => {
    // A citation with a locator opens through its durable link (#46): the catalog resolves it against the
    // current extraction and the `/cite` route picks the reader or the detail.
    if (citation.locator_key) {
      onNavigate?.();
      navigate(citePath(citation.entry_id, citation.locator_key));
      return;
    }
    const entry = await getEntryDetail(citation.entry_id).catch(() => null);
    onNavigate?.();
    if (entry?.config?.readium_enabled) {
      openEntryDetail(citation.entry_id, entry.catalog_id);
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
