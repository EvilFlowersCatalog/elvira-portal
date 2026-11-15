import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiCopy } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';

/** Copies `text`; the icon turns into a check for a moment. Clicks never reach a clickable row. */
export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const name = label ?? t('administration.copy.copy');
  return (
    <button
      type="button"
      aria-label={copied ? t('administration.copy.copied') : name}
      title={copied ? t('administration.copy.copied') : name}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={twMerge(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200',
        copied && 'text-greenText dark:text-green',
        className
      )}
    >
      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
    </button>
  );
}

/**
 * An id (UUID, Celery task id, trace id) as quiet monospace text with a copy button. `short` shows
 * the first 8 characters; the full value stays in the tooltip and is what gets copied.
 */
export default function CopyId({ value, short, label, className }: { value: string; short?: boolean; label?: string; className?: string }) {
  return (
    <span className={twMerge('inline-flex min-w-0 items-center gap-0.5', className)}>
      <code className="min-w-0 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400" title={value}>
        {short ? value.slice(0, 8) : value}
      </code>
      <CopyButton text={value} label={label} />
    </span>
  );
}
