import { twMerge } from 'tailwind-merge';

export type StatusVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral';

interface StatusChipProps {
  /** Human-readable label. Always rendered as text so status is never color-only (WCAG 1.4.1). */
  children: React.ReactNode;
  variant?: StatusVariant;
  /** Show the leading status dot. Defaults to true. */
  dot?: boolean;
  className?: string;
  title?: string;
}

/**
 * Accessible status pill used across the admin surface.
 *
 * Status is conveyed by BOTH a colored dot and a text label so it never relies
 * on color alone. Colors use the semantic *-text tokens (WCAG AA on light) and
 * dark-mode-safe tints.
 */
const VARIANT_STYLES: Record<StatusVariant, { chip: string; dot: string }> = {
  success: {
    chip: 'bg-green/15 text-greenText dark:bg-green/10 dark:text-green',
    dot: 'bg-greenText dark:bg-green',
  },
  danger: {
    chip: 'bg-red/10 text-redText dark:bg-red/15 dark:text-red',
    dot: 'bg-redText dark:bg-red',
  },
  warning: {
    chip: 'bg-amber-400/20 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    dot: 'bg-amber-600 dark:bg-amber-400',
  },
  info: {
    chip: 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight',
    dot: 'bg-primaryText dark:bg-primaryLight',
  },
  neutral: {
    chip: 'bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
  },
};

export default function StatusChip({
  children,
  variant = 'neutral',
  dot = true,
  className,
  title,
}: StatusChipProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <span
      title={title}
      className={twMerge(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap select-none',
        styles.chip,
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={twMerge('h-1.5 w-1.5 rounded-full shrink-0', styles.dot)}
        />
      )}
      {children}
    </span>
  );
}
