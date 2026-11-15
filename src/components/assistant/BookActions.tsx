import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlignLeft, FiCheckSquare, FiImage, FiInfo, FiKey, FiList } from 'react-icons/fi';
import useAssistantCapabilities from '../../hooks/api/assistant/useAssistantCapabilities';

/** Each shortcut and the catalog capability that has to be on offer for it (`GET …/capabilities`). */
const ACTIONS: { id: string; capability: string; icon: ReactElement }[] = [
  { id: 'summary', capability: 'summary', icon: <FiAlignLeft size={12} aria-hidden="true" /> },
  { id: 'walkthrough', capability: 'walkthrough', icon: <FiList size={12} aria-hidden="true" /> },
  { id: 'quiz', capability: 'quiz', icon: <FiCheckSquare size={12} aria-hidden="true" /> },
  // Figures exist only in a processed publication — the same condition as the study tools.
  { id: 'figures', capability: 'summary', icon: <FiImage size={12} aria-hidden="true" /> },
  { id: 'concepts', capability: 'concepts', icon: <FiKey size={12} aria-hidden="true" /> },
];

/**
 * One-tap requests about the publication the chat is about. There is a single input for everything (no Ask /
 * Learn / Quiz modes): a shortcut only sends the same plain request a reader could type, and the assistant
 * picks the tool (a walkthrough, a quiz card, figures) from the words.
 *
 * Only what the catalog can do for this publication is offered: the study tools need it processed and readable,
 * so for any other one the reader is told so instead of being handed shortcuts that would come back empty.
 */
export default function BookActions({
  entryId,
  bound,
  onSend,
  disabled,
}: {
  entryId: string;
  bound?: boolean;
  onSend: (message: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useAssistantCapabilities({ entryId, bound });
  if (!data) return null;

  const offered = new Set(data.capabilities.map((capability) => capability.id));
  const actions = ACTIONS.filter((action) => offered.has(action.capability));
  if (!actions.length) {
    return (
      <p className="mb-1.5 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <FiInfo size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
        {t('assistant.actions.unprocessed')}
      </p>
    );
  }

  return (
    <div role="group" aria-label={t('assistant.actions.label')} className="mb-1.5 flex flex-wrap items-center gap-1.5">
      {actions.map(({ id, icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onSend(t(`assistant.actions.${id}.message`))}
          title={t(`assistant.actions.${id}.message`)}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:text-gray-700 dark:border-zinc-600 dark:text-gray-200 dark:hover:border-primaryLight dark:hover:text-primaryLight"
        >
          {icon}
          {t(`assistant.actions.${id}.label`)}
        </button>
      ))}
    </div>
  );
}
