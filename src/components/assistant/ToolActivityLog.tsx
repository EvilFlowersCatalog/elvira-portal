import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { IAssistantToolActivity } from '../../utils/interfaces/assistant';
import { activityLabelKey, activitySummary, pagesLabel } from '../../utils/func/assistantMessages';

const muted = 'text-gray-500 dark:text-gray-400';

/** One tool call: label, query, result count or pages; publications it found expand under it. */
function ActivityRow({ call }: { call: IAssistantToolActivity }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titles = call.entries ?? [];
  const expandable = call.done && titles.length > 0;

  const facts: string[] = [];
  if (call.error) facts.push(t('assistant.activity.failed'));
  else if (call.pages?.length) facts.push(pagesLabel(call.pages, t));
  else if (call.done && typeof call.count === 'number')
    facts.push(t('assistant.activity.results', { count: call.count }));

  const line = (
    <>
      <span className={`shrink-0 ${muted}`}>{t(activityLabelKey(call.tool))}</span>
      {call.query ? <span className="truncate text-black dark:text-[#e5e7eb]">{call.query}</span> : null}
      {facts.length ? <span className={`shrink-0 ${muted}`}>· {facts.join(' · ')}</span> : null}
      {!call.done ? (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
      ) : null}
      {expandable ? (
        <FiChevronRight
          size={12}
          className={`shrink-0 ${muted} transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  return (
    <li className="border-t first:border-t-0 border-zinc-200 dark:border-zinc-700">
      {expandable ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left min-w-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {line}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 min-w-0">{line}</div>
      )}
      {expandable && open ? (
        <ul className="pb-1.5 pl-5 pr-2.5">
          {titles.map((entry, index) => (
            <li key={entry.id ?? index} className="truncate text-gray-700 dark:text-gray-300 py-0.5" title={entry.title}>
              {entry.title}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * What the assistant did for an answer, compact like a coding agent's tool log: one muted summary line
 * ("Searched the catalog 2×, read the record") that expands to one row per tool call. Live only — a chat
 * read back from history has no activity.
 */
export default function ToolActivityLog({ activity, running }: { activity: IAssistantToolActivity[]; running: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!activity.length) return null;

  const current = running ? activity.find((call) => !call.done) : undefined;
  const summary = activitySummary(
    activity.map((call) => call.tool),
    t,
  );

  return (
    <div className="text-xs w-full max-w-[85%]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t('assistant.activity.show')}
        className={`inline-flex items-center gap-1 max-w-full rounded px-1 py-0.5 ${muted} hover:text-gray-700 dark:hover:text-gray-200`}
      >
        {current ? <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{summary}</span>
        <FiChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? (
        <ul className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {activity.map((call) => (
            <ActivityRow key={call.id} call={call} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
