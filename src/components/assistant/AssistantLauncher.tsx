import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiSparkles } from 'react-icons/hi2';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

/**
 * The assistant on every page: a floating button (and ⌘K / Ctrl+K) that opens the drawer. Hidden in the viewer,
 * which has its own chat, and while the drawer is open.
 */
export default function AssistantLauncher() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { auth } = useAuthContext();
  const { showAiAssistant, setShowAiAssistant, aiMessages, umamiTrack } = useAppContext();
  const available =
    !!auth && !pathname.startsWith(NAVIGATION_PATHS.viewer) && pathname !== NAVIGATION_PATHS.aiAssistant && pathname !== NAVIGATION_PATHS.login;

  useEffect(() => {
    if (!available) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!showAiAssistant) umamiTrack('AI Assistant Shortcut');
        setShowAiAssistant(!showAiAssistant);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [available, showAiAssistant, setShowAiAssistant, umamiTrack]);

  // It stays during a guide: the portal tour ends on it, and it is the way back to the chat.
  if (!available || showAiAssistant) return null;

  const shortcut = isMac ? '⌘K' : 'Ctrl K';
  const ongoing = aiMessages.length > 0;

  return (
    <button
      type="button"
      data-guide="assistant-launcher"
      onClick={() => setShowAiAssistant(true)}
      aria-label={`${t('assistant.title')} (${shortcut})`}
      title={`${t('assistant.title')} · ${shortcut}`}
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary py-3 pl-3.5 pr-3.5 text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primaryDark hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none lg:pr-4 animate-fade-in"
    >
      <span className="relative inline-flex">
        <HiSparkles size={18} aria-hidden="true" />
        {ongoing ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white ring-2 ring-primary" aria-hidden="true" /> : null}
      </span>
      <span className="hidden text-sm font-semibold lg:inline">{t('assistant.launcher')}</span>
      <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 font-sans text-[10px] font-medium lg:inline">{shortcut}</kbd>
    </button>
  );
}
