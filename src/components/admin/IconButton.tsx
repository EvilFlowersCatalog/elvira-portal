import { ButtonHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'ghost' | 'outline' | 'solid' | 'danger';
type Size = 'sm' | 'md';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required accessible label — icon-only buttons must be named (WCAG 4.1.2). */
  label: string;
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  ghost:
    'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70',
  outline:
    'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60',
  solid:
    'bg-primary text-onPrimary hover:bg-primaryDark',
  danger:
    'text-redText dark:text-red hover:bg-red/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
};

/**
 * Accessible icon-only button. Enforces an aria-label + title and a real
 * <button> element so the control is keyboard-operable and screen-reader named.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = 'ghost', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={twMerge(
          'inline-flex items-center justify-center rounded-md transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none',
          SIZES[size],
          VARIANTS[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
