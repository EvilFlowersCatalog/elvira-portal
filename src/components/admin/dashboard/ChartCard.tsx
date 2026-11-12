import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiList } from 'react-icons/fi';
import { useParentSize } from '@visx/responsive';

/**
 * Measures only the available width; the chart sets its own height. (visx 4's
 * `ParentSize` positions its child absolutely, which collapses an auto-height card.)
 */
export const Responsive = ({
  children,
}: {
  children: (width: number) => ReactNode;
}) => {
  const { parentRef, width } = useParentSize({
    debounceTime: 50,
    ignoreDimensions: 'height',
  });
  return (
    <div
      ref={parentRef}
      className='w-full min-w-0 [contain:inline-size]'
    >
      {width > 0 ? children(width) : null}
    </div>
  );
};

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  /** Phrased as the question the chart answers. */
  title: string;
  /** One or two sentences: how to read it and what to do about it. */
  description?: ReactNode;
  /** Every chart has a table twin — values must never be hover-only. */
  table?: TableView;
  /** Short takeaway shown under the title, computed from the data. */
  insight?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const ChartCard = ({
  title,
  description,
  table,
  insight,
  className = '',
  children,
}: ChartCardProps) => {
  const { t } = useTranslation();
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
    >
      <header className='mb-3 flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3
            id={headingId}
            className='text-base font-semibold text-zinc-900 dark:text-zinc-100'
          >
            {title}
          </h3>
          {description && (
            <p className='mt-1 text-sm leading-snug text-zinc-500 dark:text-zinc-400'>
              {description}
            </p>
          )}
          {insight && (
            <p className='mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200'>
              {insight}
            </p>
          )}
        </div>
        {table && (
          <button
            type='button'
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            title={
              asTable
                ? t('administration.dashboard.showChart')
                : t('administration.dashboard.showTable')
            }
            className='shrink-0 rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
          >
            {asTable ? <FiBarChart2 size={16} /> : <FiList size={16} />}
            <span className='sr-only'>
              {asTable
                ? t('administration.dashboard.showChart')
                : t('administration.dashboard.showTable')}
            </span>
          </button>
        )}
      </header>
      <div className='viz-root min-h-0 flex-1'>
        {asTable && table ? <SimpleTable table={table} /> : children}
      </div>
    </section>
  );
};

export const SimpleTable = ({ table }: { table: TableView }) => (
  <div className='max-h-96 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-700'>
    <table className='w-full text-left text-sm'>
      <thead className='sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'>
        <tr>
          {table.columns.map((c) => (
            <th key={c} className='px-3 py-2 font-semibold'>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className='divide-y divide-zinc-100 dark:divide-zinc-700'>
        {table.rows.map((r, i) => (
          <tr key={i} className='text-zinc-700 dark:text-zinc-200'>
            {r.map((cell, j) => (
              <td
                key={j}
                className={`px-3 py-1.5 ${typeof cell === 'number' || j > 0 ? 'tabular-nums' : ''}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Tooltip body: value strong, label secondary, a short line-key for the series. */
export const TooltipBox = ({
  title,
  rows,
  footer,
}: {
  title?: string;
  rows: { label: string; value: string; color?: string }[];
  footer?: string;
}) => (
  <div className='min-w-[9rem] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-600 dark:bg-zinc-900'>
    {title && (
      <div className='mb-1 font-medium text-zinc-500 dark:text-zinc-400'>
        {title}
      </div>
    )}
    {rows.map((r) => (
      <div key={r.label} className='flex items-center gap-2 py-0.5'>
        {r.color && (
          <span
            className='h-0.5 w-3 rounded-full'
            style={{ background: r.color }}
          />
        )}
        <span className='text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50'>
          {r.value}
        </span>
        <span className='text-zinc-500 dark:text-zinc-400'>{r.label}</span>
      </div>
    ))}
    {footer && (
      <div className='mt-1 border-t border-zinc-100 pt-1 text-[11px] text-zinc-400 dark:border-zinc-700'>
        {footer}
      </div>
    )}
  </div>
);

export const Legend = ({
  items,
}: {
  items: { label: string; color: string; shape?: 'line' | 'rect' | 'dot' }[];
}) => (
  <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300'>
    {items.map((i) => (
      <li key={i.label} className='flex items-center gap-1.5'>
        <span
          className={
            i.shape === 'line'
              ? 'h-0.5 w-3.5 rounded-full'
              : i.shape === 'dot'
                ? 'h-2.5 w-2.5 rounded-full'
                : 'h-2.5 w-2.5 rounded-sm'
          }
          style={{ background: i.color }}
        />
        {i.label}
      </li>
    ))}
  </ul>
);
