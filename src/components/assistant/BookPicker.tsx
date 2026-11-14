import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookOpen } from 'react-icons/fi';
import useEntrySuggest from '../../hooks/api/entries/useEntrySuggest';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useEscapeLayer from '../../hooks/useEscapeLayer';
import { IAssistantEntryRef } from '../../hooks/api/assistant/useAssistantChat';

/**
 * Attaches a publication to a plain chat by hand (IP-022 Phase 6, carried over to IP-030): the next messages
 * carry its `entry_id`, which the catalog already accepts. A type-ahead over the library.
 */
export default function BookPicker({
  onPick,
  disabled,
}: {
  onPick: (entry: IAssistantEntryRef) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 250);
  const wrapper = useRef<HTMLDivElement>(null);
  useEscapeLayer(() => setOpen(false), open);
  const { data } = useEntrySuggest(debounced, { enabled: open && debounced.length >= 2, limit: 6 });
  const entries = debounced.length >= 2 ? data?.entries ?? [] : [];

  return (
    <div
      ref={wrapper}
      className="relative"
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={t('assistant.picker.attach')}
        title={t('assistant.picker.attach')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center p-1 rounded-md text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
      >
        <FiBookOpen size={15} />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 mb-2 w-72 max-w-[80vw] z-20 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 flex flex-col gap-1">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('assistant.picker.search')}
            aria-label={t('assistant.picker.search')}
            className="text-sm px-2 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white outline-none"
          />
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                onPick({ id: entry.id, title: entry.title, catalogId: entry.catalog_id });
                setOpen(false);
                setQuery('');
              }}
              className="text-left px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-0"
            >
              <span className="block text-sm text-black dark:text-white truncate">{entry.title}</span>
              {entry.authors.length ? (
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">{entry.authors.join(', ')}</span>
              ) : null}
            </button>
          ))}
          {debounced.length >= 2 && data && !entries.length ? (
            <p className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">{t('assistant.picker.none')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
