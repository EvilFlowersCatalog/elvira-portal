import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import IconButton from './IconButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Sticky footer actions (e.g. Save / Cancel). */
  footer?: React.ReactNode;
  width?: string;
}

/**
 * Accessible right-side slide-over. role="dialog" + aria-modal, Escape to close,
 * backdrop click to dismiss, focus moved into the panel on open and restored on
 * close. Used for admin detail/edit surfaces.
 */
export default function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-md',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Move focus into the panel.
    const t = setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex h-full w-full ${width} flex-col bg-white dark:bg-zinc-800 shadow-2xl animate-fly-right`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-secondary dark:text-secondaryLight truncate">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 truncate">{description}</p>
            )}
          </div>
          <IconButton label="Close" variant="ghost" onClick={onClose}>
            <FiX size={18} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-700 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
