import { useEffect, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IUser } from '../../utils/interfaces/user';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import useDebouncedValue from '../../hooks/useDebouncedValue';

interface UserPickerProps {
  onSelect: (user: IUser) => void;
  /** User ids to hide from results (already selected). */
  exclude?: string[];
  placeholder: string;
  label: string;
}

/** Debounced user search dropdown for granting access / picking a user. */
export default function UserPicker({ onSelect, exclude = [], placeholder, label }: UserPickerProps) {
  const getUsers = useGetUsers();
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const [results, setResults] = useState<IUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    getUsers({ page: 1, limit: 8, username: debounced.trim() })
      .then(({ items }) => alive && setResults(items))
      .catch(() => alive && setResults([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = results.filter((u) => !exclude.includes(u.id));

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 px-3 h-10 focus-within:border-primary">
        <FiSearch aria-hidden="true" size={16} className="text-zinc-400 shrink-0" />
        <input
          aria-label={label}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>
      {open && (text.trim() || loading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-zinc-400">…</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-400">—</div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelect(u);
                  setText('');
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{u.username}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {`${u.name ?? ''} ${u.surname ?? ''}`.trim()}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
