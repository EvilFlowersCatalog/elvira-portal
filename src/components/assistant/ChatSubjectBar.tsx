import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import useOpenInViewer from '../../hooks/api/assistant/useOpenInViewer';

/**
 * The publication the open chat is about, like the subject line in the
 * viewer's chat. The title opens the publication's detail; the action opens it
 * in the reader, or — for a Readium book, which is borrowed and never read
 * here — its detail, where it can be borrowed. Hidden for general chats.
 */
export default function ChatSubjectBar({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const { aiChatSubject } = useAppContext();
  const openInViewer = useOpenInViewer();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!aiChatSubject) return null;

  const readable = aiChatSubject.readable !== false;

  // Same query params as EntryItem's openEntryDetail; the detail yields to nothing.
  const openDetail = () => {
    const params = new URLSearchParams(searchParams);
    params.set('entry-detail-id', aiChatSubject.entryId);
    if (aiChatSubject.catalogId) params.set('entry-catalog-id', aiChatSubject.catalogId);
    params.set('dialog-priority', 'entry-detail');
    setSearchParams(params);
  };

  return (
    <div
      className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 ${
        compact ? '' : 'mb-2'
      }`}
    >
      <FiBookOpen size={14} className="shrink-0" />
      <button type="button" className="truncate flex-1 text-left hover:underline" onClick={openDetail}>
        {aiChatSubject.title ? t('assistant.aboutBook', { title: aiChatSubject.title }) : t('assistant.aboutThisBook')}
      </button>
      <button
        type="button"
        className="shrink-0 font-medium text-sky-700 dark:text-sky-300 hover:underline"
        onClick={() => {
          if (!readable) {
            openDetail();
            return;
          }
          onNavigate?.();
          openInViewer(aiChatSubject);
        }}
      >
        {readable ? t('assistant.openInReader') : t('assistant.openDetail')}
      </button>
    </div>
  );
}
