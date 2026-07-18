import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiSliders,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import IconButton from './IconButton';
import Select from '../primitives/Select';
import Checkbox from '../primitives/Checkbox';

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

export interface DataTableColumn<T> {
  /** Stable column id. */
  id: string;
  header: ReactNode;
  /** Renders the cell content for a row. */
  cell: (row: T) => ReactNode;
  /** Server sort key; presence enables sorting on this column. */
  sortKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** Can the user hide this column? Defaults to true. */
  hideable?: boolean;
  /** Start hidden (still toggleable). */
  defaultHidden?: boolean;
  cellClassName?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  /** Accessible caption describing the table (e.g. "Users (128)"). */
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;

  /** Server-driven sort. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;

  /** States. */
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  /** Pagination (1-based page). Omit to hide the footer. */
  page?: number;
  pageCount?: number;
  total?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** Content rendered above the table (search, filters, actions). */
  toolbar?: ReactNode;
  /** Persist column visibility under this key in localStorage. */
  storageKey?: string;
  className?: string;
  density?: 'comfortable' | 'compact';
}

function useHiddenColumns<T>(columns: DataTableColumn<T>[], storageKey?: string) {
  const initial = useMemo(() => {
    const fromDefaults = columns.filter((c) => c.defaultHidden).map((c) => c.id);
    if (storageKey) {
      try {
        const raw = localStorage.getItem(`dt:${storageKey}`);
        if (raw) return new Set<string>(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    return new Set<string>(fromDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const [hidden, setHidden] = useState<Set<string>>(initial);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`dt:${storageKey}`, JSON.stringify([...hidden]));
    } catch {
      /* ignore */
    }
  }, [hidden, storageKey]);

  return [hidden, setHidden] as const;
}

/** Accessible column-visibility menu. */
function ColumnsMenu<T>({
  columns,
  hidden,
  onToggle,
  label,
}: {
  columns: DataTableColumn<T>[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hideable = columns.filter((c) => c.hideable !== false);
  if (hideable.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <IconButton
        label={label}
        variant="outline"
        size="sm"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FiSliders size={16} />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 shadow-lg"
        >
          {hideable.map((col) => {
            const checked = !hidden.has(col.id);
            return (
              <Checkbox
                key={col.id}
                checked={checked}
                onChange={() => onToggle(col.id)}
                className="w-full rounded-md px-2 py-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
                label={<span className="truncate">{typeof col.header === 'string' ? col.header : col.id}</span>}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Generic, accessible admin data table (semantic <table>, Tailwind, dark-mode
 * correct). Server-driven sort + pagination, first-class loading/empty/error
 * states, keyboard column visibility, and optional row click.
 */
export default function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  onRowClick,
  sort,
  onSortChange,
  loading,
  error,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  page,
  pageCount,
  total,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  toolbar,
  storageKey,
  density = 'comfortable',
}: DataTableProps<T>) {
  const [hidden, setHidden] = useHiddenColumns(columns, storageKey);
  const visible = columns.filter((c) => !hidden.has(c.id));
  const rowPad = density === 'compact' ? 'px-4 py-2' : 'px-4 py-3';
  const hasPagination = page != null && onPageChange != null;

  // Only wipe to a skeleton on the very first load. Once we have rows, a
  // pagination / search / sort refetch keeps the previous rows on screen (dimmed
  // slightly, with a top progress bar) instead of flashing the whole table to
  // skeletons — the same "no wipe" behaviour used by the public grid.
  const showSkeleton = !!loading && rows.length === 0;
  const isRefreshing = !!loading && rows.length > 0;

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortKey || !onSortChange) return;
    const nextDir: SortDir =
      sort?.key === col.sortKey && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.sortKey, dir: nextDir });
  };

  return (
    <div className="px-5 pb-6">
      {(toolbar || columns.some((c) => c.hideable !== false)) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">{toolbar}</div>
          <ColumnsMenu
            columns={columns}
            hidden={hidden}
            onToggle={(id) =>
              setHidden((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              })
            }
            label="Show or hide columns"
          />
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
        {/* Indeterminate progress bar for background refetches (page / search /
            sort) — the rows below stay visible instead of wiping to a skeleton. */}
        {isRefreshing && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[loadingbar_1s_ease-in-out_infinite] bg-primary" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm" aria-busy={isRefreshing}>
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40">
                {visible.map((col) => {
                  const isSorted = col.sortKey && sort?.key === col.sortKey;
                  const ariaSort = isSorted
                    ? sort!.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : col.sortKey
                      ? 'none'
                      : undefined;
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      aria-sort={ariaSort as any}
                      style={{ width: col.width }}
                      className={twMerge(
                        'px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap',
                        ALIGN[col.align ?? 'left'],
                        col.headerClassName
                      )}
                    >
                      {col.sortKey ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className={twMerge(
                            'inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors',
                            col.align === 'right' && 'flex-row-reverse',
                            isSorted && 'text-zinc-800 dark:text-zinc-100'
                          )}
                        >
                          {col.header}
                          {isSorted ? (
                            sort!.dir === 'asc' ? (
                              <FiArrowUp size={13} aria-hidden="true" />
                            ) : (
                              <FiArrowDown size={13} aria-hidden="true" />
                            )
                          ) : (
                            <FiArrowUp size={13} className="opacity-25" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody
              className={twMerge(
                'divide-y divide-zinc-100 dark:divide-zinc-700/60 transition-opacity duration-200',
                isRefreshing && 'opacity-60'
              )}
            >
              {showSkeleton ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {visible.map((col) => (
                      <td key={col.id} className={rowPad}>
                        <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={visible.length} className="px-4 py-16 text-center">
                    <p className="text-sm text-redText dark:text-red">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 text-sm font-medium text-primaryText dark:text-primaryLight hover:underline"
                      >
                        Try again
                      </button>
                    )}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={visible.length} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{emptyTitle}</p>
                    {emptyDescription && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{emptyDescription}</p>
                    )}
                    {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={twMerge(
                      'text-zinc-700 dark:text-zinc-200',
                      onRowClick &&
                        'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors'
                    )}
                  >
                    {visible.map((col) => (
                      <td
                        key={col.id}
                        className={twMerge(rowPad, 'align-middle', ALIGN[col.align ?? 'left'], col.cellClassName)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasPagination && (
          <DataTableFooter
            page={page!}
            pageCount={pageCount ?? 1}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={onPageChange!}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    </div>
  );
}

function DataTableFooter({
  page,
  pageCount,
  total,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  total?: number;
  pageSize?: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {onPageSizeChange && pageSize != null && (
          <>
            <label htmlFor="dt-page-size" className="text-zinc-500 dark:text-zinc-400">
              Rows
            </label>
            <Select
              id="dt-page-size"
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(parseInt(value, 10))}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              className="w-20"
              triggerClassName="py-1"
            />
          </>
        )}
        {total != null && (
          <span className="text-zinc-400 dark:text-zinc-500">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 tabular-nums">
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        <IconButton label="First page" variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <FiChevronsLeft size={16} />
        </IconButton>
        <IconButton label="Previous page" variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <FiChevronLeft size={16} />
        </IconButton>
        <IconButton
          label="Next page"
          variant="ghost"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronRight size={16} />
        </IconButton>
        <IconButton
          label="Last page"
          variant="ghost"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
        >
          <FiChevronsRight size={16} />
        </IconButton>
      </div>
    </div>
  );
}
