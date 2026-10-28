import { useTranslation } from 'react-i18next';
import { FiBookOpen } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import useOpenInViewer from '../../hooks/api/assistant/useOpenInViewer';

/**
 * The publication the open chat is about, like the subject line in the
 * viewer's chat, with a shortcut back into the book. Hidden for general chats.
 */
export default function ChatSubjectBar({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const { aiChatSubject } = useAppContext();
  const openInViewer = useOpenInViewer();

  if (!aiChatSubject) return null;

  return (
    <div
      className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 ${
        compact ? '' : 'mb-2'
      }`}
    >
      <FiBookOpen size={14} className="shrink-0" />
      <span className="truncate flex-1">
        {aiChatSubject.title ? t('assistant.aboutBook', { title: aiChatSubject.title }) : t('assistant.aboutThisBook')}
      </span>
      {aiChatSubject.readable !== false && (
      <button
        type="button"
        className="shrink-0 font-medium text-sky-700 dark:text-sky-300 hover:underline"
        onClick={() => {
          onNavigate?.();
          openInViewer(aiChatSubject);
        }}
      >
        {t('assistant.openInReader')}
      </button>
      )}
    </div>
  );
}
