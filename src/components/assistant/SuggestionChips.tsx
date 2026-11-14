import { IAssistantSuggestion } from '../../utils/interfaces/assistant';

/**
 * Follow-ups under the last answer (IP-030 Phase 2), built by the catalog from the evidence — the next section,
 * a cited figure, similar passages in other books, a quiz. A click sends the chip's message.
 */
export default function SuggestionChips({
  suggestions,
  onSend,
}: {
  suggestions: IAssistantSuggestion[];
  onSend?: (message: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((suggestion) => (
        <button
          key={`${suggestion.kind}-${suggestion.message}`}
          type="button"
          disabled={!onSend}
          title={suggestion.message}
          onClick={() => onSend?.(suggestion.message)}
          className="text-xs px-2.5 py-1 rounded-full border border-primary/40 text-primary dark:text-white bg-primary/5 hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
