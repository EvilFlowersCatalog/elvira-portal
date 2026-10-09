import { CSSProperties, KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiArrowDownSLine } from 'react-icons/ri';
import { twMerge } from 'tailwind-merge';

const LIST_MAX_HEIGHT = 240;
const LIST_GAP = 4;
const VIEWPORT_MARGIN = 8;

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
  /** Prefer opening above the trigger. Without it the list still flips up when it would not fit below. */
  dropUp?: boolean;
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
  dropUp = false,
  ...rest
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [listStyle, setListStyle] = useState<CSSProperties>({ visibility: 'hidden' });
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const selected = options.find((o) => o.value === value);

  // The list is portalled to <body> and positioned against the viewport, so no
  // ancestor with `overflow` (table scroll area, drawer body, card) can clip it.
  // It flips above the trigger when there is not enough room below.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = ref.current?.getBoundingClientRect();
      if (!trigger) return;
      const listHeight = Math.min(listRef.current?.scrollHeight ?? 0, LIST_MAX_HEIGHT);
      const below = window.innerHeight - trigger.bottom - LIST_GAP - VIEWPORT_MARGIN;
      const above = trigger.top - LIST_GAP - VIEWPORT_MARGIN;
      const up = dropUp ? above >= listHeight || above > below : below < listHeight && above > below;
      setListStyle({
        left: trigger.left,
        width: trigger.width,
        maxHeight: Math.max(Math.min(LIST_MAX_HEIGHT, up ? above : below), 96),
        ...(up ? { bottom: window.innerHeight - trigger.top + LIST_GAP } : { top: trigger.bottom + LIST_GAP }),
      });
    };
    place();
    // Capture phase: also follow scrolling of any ancestor, not just the window.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, dropUp, options.length]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
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

      {open && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={selectId}
          style={listStyle}
          // Above drawers (z-50) and confirm dialogs (z-60), which host selects too.
          className="fixed z-[70] overflow-auto rounded-md border border-[#e5e5e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] py-1"
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
        </ul>,
        document.body
      )}
    </div>
  );
};

export default Select;
