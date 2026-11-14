import { useLocation, useNavigate } from 'react-router-dom';
import { AiChatSubject } from '../../../providers/AppProvider';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import type { IAssistantBox } from '../../../utils/interfaces/assistant';
import useGetEntryDetail from '../entries/useGetEntryDetail';

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

/** What the viewer route finds in its navigation state. */
export interface IViewerLocationState {
  catalogId?: string;
  fromPath?: string;
  target?: IViewerTarget;
}

/**
 * Opens a chat's publication in the viewer, optionally at a page and a target on it. The chat
 * remembers which file (acquisition) it was read from; the viewer route takes
 * the file's index in the entry, so that is looked up first.
 *
 * The target travels as navigation state (boxes are too big for a URL); `p` / `r` in the query keep the
 * paragraph or region id in a link that is copied or reloaded.
 */
const useOpenInViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getEntryDetail } = useGetEntryDetail();

  return async (subject: AiChatSubject, page?: number, target?: IViewerTarget) => {
    let index = 0;
    if (subject.acquisitionId) {
      try {
        const entry = await getEntryDetail(subject.entryId, subject.catalogId ?? undefined);
        index = Math.max(0, entry.acquisitions.findIndex((a) => a.id === subject.acquisitionId));
      } catch {
        // The first file is the right one for almost every publication.
      }
    }

    const state: IViewerLocationState = {
      fromPath: `${location.pathname}${location.search}`,
    };
    if (subject.catalogId) state.catalogId = subject.catalogId;
    if (target && (target.bbox || target.quads?.length)) state.target = target;

    const query = new URLSearchParams();
    if (page) query.set('page', String(page));
    if (target?.paragraphId) query.set('p', target.paragraphId);
    else if (target?.regionId) query.set('r', target.regionId);
    const search = query.toString();
    navigate(`${NAVIGATION_PATHS.viewer}${subject.entryId}/${index}${search ? `?${search}` : ''}`, { state });
  };
};

export default useOpenInViewer;
