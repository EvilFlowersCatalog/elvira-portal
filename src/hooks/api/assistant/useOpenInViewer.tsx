import { useNavigate } from 'react-router-dom';
import { AiChatSubject } from '../../../providers/AppProvider';
import type { IAssistantBox } from '../../../utils/interfaces/assistant';
import useGetEntryDetail from '../entries/useGetEntryDetail';
import { readerPath } from '@/lib/links/paths';
import { readablePdfIndex } from '../../useOpenPublication';

/**
 * Where on the page a citation points (IP-030 Phase 1): the paragraph (or figure) box to outline and the quads
 * of the cited sentence to flash. Fractions of the page, origin top-left — the coordinates of agent highlights.
 */
export interface IViewerTarget {
  paragraphId?: string;
  regionId?: string;
  bbox?: IAssistantBox;
  quads?: IAssistantBox[];
  /** The page the quads are on, when it is not the cited page (a sentence running onto the next one). */
  quadsPage?: number;
}

/**
 * What the reader route may find in its navigation state: only an enrichment of the URL. The URL alone
 * (page, `loc`, `p`, `r`) must open the same place, so a refresh or a copied link loses at most the
 * sentence flash of a citation without a locator.
 */
export interface IViewerLocationState {
  target?: IViewerTarget;
}

/**
 * Opens a chat's publication in the reader, optionally at a page and a target on it. The chat remembers
 * which file (acquisition) it was read from; it is named in the address when it isn't the readable PDF.
 */
const useOpenInViewer = () => {
  const navigate = useNavigate();
  const { getEntryDetail } = useGetEntryDetail();

  return async (subject: AiChatSubject, page?: number, target?: IViewerTarget) => {
    let file: string | null = null;
    if (subject.acquisitionId) {
      try {
        const entry = await getEntryDetail(subject.entryId, subject.catalogId ?? undefined);
        const index = entry.acquisitions.findIndex((a) => a.id === subject.acquisitionId);
        if (index >= 0 && index !== readablePdfIndex(entry)) file = subject.acquisitionId;
      } catch {
        // The reader route answers for an unknown or hidden publication.
      }
    }

    const state: IViewerLocationState = {};
    // A region id alone is enough: the viewer outlines the region with its own box (`regionPackage`).
    if (target && (target.bbox || target.quads?.length || target.regionId)) state.target = target;

    navigate(
      readerPath(subject.entryId, {
        file,
        page,
        p: target?.paragraphId,
        r: target?.paragraphId ? null : target?.regionId,
        catalogId: subject.catalogId,
      }),
      { state },
    );
  };
};

export default useOpenInViewer;
