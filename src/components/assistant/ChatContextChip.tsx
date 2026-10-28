import { useTranslation } from 'react-i18next';
import { FiAlignLeft, FiHelpCircle, FiImage, FiMessageSquare } from 'react-icons/fi';
import { IChatContext } from '../../utils/interfaces/assistant';
import { contextPage } from '../../utils/func/assistantMessages';

const clip = (text: string, max = 48) => (text.length > max ? `${text.slice(0, max)}…` : text);

/**
 * One thing the reader attached to a message in the viewer — a selection, an
 * explanation, a figure/table/equation or an agent highlight. Mirrors the
 * viewer's ContextChip; clicking it opens the book at its page.
 */
export default function ChatContextChip({
  context,
  inverted,
  onOpenPage,
}: {
  context: IChatContext;
  inverted?: boolean;
  onOpenPage?: (page: number) => void;
}) {
  const { t } = useTranslation();
  const page = contextPage(context);

  const { Icon, label } = (() => {
    switch (context.kind) {
      case 'selection':
        return { Icon: FiAlignLeft, label: `„${clip(context.text)}“` };
      case 'explain':
        return { Icon: FiHelpCircle, label: `${t('assistant.context.explain')}: „${clip(context.text, 36)}“` };
      case 'region':
        return {
          Icon: FiImage,
          label: `${t(`assistant.region.${context.region.kind}`)}${context.region.caption ? `: ${clip(context.region.caption, 36)}` : ''}`,
        };
      case 'highlight':
        return { Icon: FiMessageSquare, label: `#${context.highlight.seq} „${clip(context.highlight.text, 36)}“` };
    }
  })();

  return (
    <button
      type="button"
      title={label}
      disabled={!onOpenPage}
      onClick={() => onOpenPage?.(page)}
      className={`inline-flex items-center max-w-full gap-1 px-1.5 py-0.5 rounded-md text-xs disabled:cursor-default ${
        inverted
          ? 'bg-white/20 text-white enabled:hover:bg-white/30'
          : 'bg-primary/10 text-primary dark:text-white enabled:hover:bg-primary/20'
      }`}
    >
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
      <span className="shrink-0 opacity-70">· {t('assistant.pageShort', { page })}</span>
    </button>
  );
}
