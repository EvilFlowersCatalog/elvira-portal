import { forwardRef, InputHTMLAttributes, ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { RiCheckLine, RiSubtractLine } from 'react-icons/ri';
import { twMerge } from 'tailwind-merge';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  invalid?: boolean;
  labelClassName?: string;
  /** Mixed state ("some selected"): shown as a dash; the native `indeterminate` flag is set for screen readers. */
  indeterminate?: boolean;
}

/** Custom-styled checkbox (native <input> under the hood for a11y/forms) — replaces the bare browser default. */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, invalid, className, labelClassName, id, indeterminate, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const inner = useRef<HTMLInputElement | null>(null);

    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        inner.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    useEffect(() => {
      if (inner.current) inner.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    const mixed = !!indeterminate && !props.checked;

    return (
      <label htmlFor={checkboxId} className={twMerge('inline-flex cursor-pointer select-none items-center gap-2', className)}>
        <span className="relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            ref={setRef}
            type="checkbox"
            id={checkboxId}
            className={twMerge(
              'peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[4px] border-2 bg-white transition-colors dark:bg-transparent',
              'checked:bg-primary checked:border-primary',
              mixed && 'border-primary bg-primary dark:bg-primary',
              !mixed && (invalid ? 'border-red' : 'border-zinc-400 dark:border-zinc-500')
            )}
            {...props}
          />
          {mixed ? (
            <RiSubtractLine size={14} className="pointer-events-none absolute text-white" aria-hidden="true" />
          ) : (
            <RiCheckLine
              size={14}
              className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
              aria-hidden="true"
            />
          )}
        </span>
        {label && <span className={twMerge('text-sm text-black dark:text-white', labelClassName)}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
