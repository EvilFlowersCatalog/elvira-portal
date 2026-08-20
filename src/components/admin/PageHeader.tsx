import { twMerge } from 'tailwind-merge';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (e.g. primary "Add" button). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent admin page header: large navy H1 + optional description, with a
 * right-aligned action slot. Matches the Figma content-area header language.
 */
export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={twMerge(
        'flex flex-col gap-3 px-5 pt-1 pb-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-secondary dark:text-secondaryLight text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
