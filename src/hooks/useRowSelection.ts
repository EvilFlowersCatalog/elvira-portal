import { useCallback, useMemo, useState } from 'react';

/**
 * Selected table rows, kept by id across pages (the rows themselves are kept too, so a bulk
 * action can name them without refetching). Pair with `DataTable`'s `selection` prop.
 */
export default function useRowSelection<T>(getId: (row: T) => string) {
  const [rows, setRows] = useState<Map<string, T>>(() => new Map());

  const onChange = useCallback(
    (changed: T[], selected: boolean) =>
      setRows((prev) => {
        const next = new Map(prev);
        changed.forEach((row) => (selected ? next.set(getId(row), row) : next.delete(getId(row))));
        return next;
      }),
    [getId]
  );

  const clear = useCallback(() => setRows(new Map()), []);
  /** Replace the selection with exactly these rows. */
  const replace = useCallback((next: T[]) => setRows(new Map(next.map((row) => [getId(row), row]))), [getId]);

  const ids = useMemo(() => new Set(rows.keys()), [rows]);

  return { rows: [...rows.values()], ids, size: rows.size, onChange, clear, replace };
}
