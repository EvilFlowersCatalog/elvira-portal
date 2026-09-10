import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Tooltip from '../primitives/Tooltip';

interface SearchFieldProps {
  /** Current committed value (controlled). */
  value: string;
  /** Called with the debounced value when the user pauses typing. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label for the input (visually hidden). */
  label: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Debounced, accessible, clearable search box that matches the Figma full-width
 * search card. Emits the debounced value via onChange; owns its own text state
 * so typing stays snappy.
 */
export default function SearchField({
  value,
  onChange,
  placeholder,
  label,
  debounceMs = 350,
  className,
  autoFocus,
}: SearchFieldProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, debounceMs);
  const lastEmitted = useRef(value);

  // Emit debounced changes upward.
  useEffect(() => {
    if (debounced !== lastEmitted.current) {
      lastEmitted.current = debounced;
      onChange(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Keep in sync when the external value changes (e.g. cleared filters).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(value);
    }
  }, [value]);

  return (
    <div
      className={twMerge(
        'flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 h-11 shadow-sm focus-within:border-primary transition-colors',
        className
      )}
    >
      <FiSearch aria-hidden="true" className="text-zinc-400 shrink-0" size={18} />
      <input
        type="search"
        aria-label={label}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
      />
      {text && (
        <Tooltip content="Clear search">
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setText('')}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
          >
            <FiX size={16} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
