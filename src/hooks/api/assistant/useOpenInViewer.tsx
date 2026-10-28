import { useLocation, useNavigate } from 'react-router-dom';
import { AiChatSubject } from '../../../providers/AppProvider';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useGetEntryDetail from '../entries/useGetEntryDetail';

/**
 * Opens a chat's publication in the viewer, optionally at a page. The chat
 * remembers which file (acquisition) it was read from; the viewer route takes
 * the file's index in the entry, so that is looked up first.
 */
const useOpenInViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getEntryDetail } = useGetEntryDetail();

  return async (subject: AiChatSubject, page?: number) => {
    let index = 0;
    if (subject.acquisitionId) {
      try {
        const entry = await getEntryDetail(subject.entryId, subject.catalogId ?? undefined);
        index = Math.max(0, entry.acquisitions.findIndex((a) => a.id === subject.acquisitionId));
      } catch {
        // The first file is the right one for almost every publication.
      }
    }

    const state: { catalogId?: string; fromPath?: string } = {
      fromPath: `${location.pathname}${location.search}`,
    };
    if (subject.catalogId) state.catalogId = subject.catalogId;
    navigate(`${NAVIGATION_PATHS.viewer}${subject.entryId}/${index}${page ? `?page=${page}` : ''}`, { state });
  };
};

export default useOpenInViewer;
