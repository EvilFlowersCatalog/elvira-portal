import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown next to the label. */
  count?: number | null;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}

/** Pill tabs shared by every admin page that splits its content into views. */
export default function Tabs({ tabs, active, onChange, label, className }: TabsProps) {
  return (
    <div role="tablist" aria-label={label} className={twMerge('mb-1 flex gap-2 overflow-x-auto px-5', className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={twMerge(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={twMerge(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  selected ? 'bg-white/60 dark:bg-black/20' : 'bg-zinc-200/70 dark:bg-zinc-700'
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
