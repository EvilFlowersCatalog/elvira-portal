import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { twMerge } from 'tailwind-merge';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  'aria-label'?: string;
}

/** Custom dropdown matching the app's design (see Navbar's CatalogSelect) — replaces the native <select>. */
const Select = ({
  value,
  onChange,
  options,
  placeholder = '',
  id,
  name,
  disabled,
  className,
  triggerClassName,
  ...rest
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className={twMerge('relative w-full', className)} ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest['aria-label']}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        className={twMerge(
          'flex w-full items-center justify-between gap-2 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-left text-sm outline-none transition-colors hover:border-primary disabled:opacity-40 disabled:pointer-events-none dark:text-white',
          open && 'border-primary',
          triggerClassName
        )}
      >
        <span className={twMerge('truncate', !selected && 'text-zinc-400 dark:text-zinc-500')}>
          {selected ? selected.label : placeholder}
        </span>
        <RiArrowDownSLine
          size={18}
          className={twMerge('shrink-0 text-zinc-400 transition-transform duration-150', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#e5e5e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] py-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={twMerge(
                    'w-full truncate px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700',
                    isSelected && 'bg-zinc-50 font-medium text-primary dark:bg-zinc-700/60 dark:text-primaryLight'
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
