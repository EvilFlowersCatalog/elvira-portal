import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { twMerge } from 'tailwind-merge';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Accessible label + hint + error wrapper. Associates label/hint/error with the control via ids. */
export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={twMerge('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
        {required && <span className="ml-0.5 text-redText dark:text-red">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-redText dark:text-red">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge(
        'h-10 w-full rounded-lg border bg-white dark:bg-zinc-900/40 px-3 text-sm text-zinc-800 dark:text-zinc-100 outline-none transition-colors placeholder:text-zinc-400',
        invalid
          ? 'border-redText dark:border-red focus:border-redText'
          : 'border-zinc-300 dark:border-zinc-600 focus:border-primary',
        className
      )}
      {...props}
    />
  )
);
TextInput.displayName = 'TextInput';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

/** Accessible toggle switch (role=switch, keyboard operable via the underlying checkbox). */
export function Switch({ checked, onChange, label, id, disabled }: SwitchProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-3 select-none">
      <span className="relative inline-flex">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-zinc-300 dark:bg-zinc-600 transition-colors peer-checked:bg-primary peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm text-zinc-700 dark:text-zinc-200">{label}</span>
    </label>
  );
}
