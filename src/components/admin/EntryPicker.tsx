import { useEffect, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import useEntrySuggest from '../../hooks/api/entries/useEntrySuggest';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { IEntrySuggestions } from '../../utils/interfaces/entry';

export type PickedEntry = IEntrySuggestions['entries'][number];

/** Debounced publication search dropdown (the type-ahead's entries), shaped like `UserPicker`. */
export default function EntryPicker({
  onSelect,
  placeholder,
  label,
}: {
  onSelect: (entry: PickedEntry) => void;
  placeholder: string;
  label: string;
}) {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text.trim(), 300);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useEntrySuggest(debounced, { enabled: debounced.length >= 2, limit: 8 });
  const results = debounced.length >= 2 ? data?.entries ?? [] : [];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 focus-within:border-primary dark:border-zinc-600 dark:bg-zinc-900/40">
        <FiSearch aria-hidden="true" size={16} className="shrink-0 text-zinc-400" />
        <input
          aria-label={label}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />
      </div>
      {open && text.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {isFetching && !results.length ? (
            <div className="px-3 py-2 text-sm text-zinc-400">…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-400">—</div>
          ) : (
            results.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  onSelect(entry);
                  setText('');
                  setOpen(false);
                }}
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{entry.title}</span>
                {entry.authors.length ? (
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{entry.authors.join(', ')}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
