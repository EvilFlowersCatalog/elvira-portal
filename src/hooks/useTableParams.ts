import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SortState } from '../components/admin/DataTable';

interface TableParamDefaults {
  limit?: number;
  /** Applied when the URL carries no `order_by`, e.g. '-starts_at'. */
  orderBy?: string;
}

/**
 * Admin table state (page, page size, search, sort) kept in the URL so every
 * list is shareable and survives back/forward. Spread `tableProps` on a DataTable.
 */
export default function useTableParams({ limit: defaultLimit = 10, orderBy: defaultOrder = '' }: TableParamDefaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const q = searchParams.get('q') || '';
  const orderBy = searchParams.get('order_by') || defaultOrder;

  const sort: SortState | null = useMemo(
    () => (orderBy ? { key: orderBy.replace(/^-/, ''), dir: orderBy.startsWith('-') ? 'desc' : 'asc' } : null),
    [orderBy]
  );

  /** Set or (with null / '') remove URL params in one navigation. */
  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const tableProps = {
    sort,
    onSortChange: (s: SortState) => patch({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: null }),
    onPageChange: (p: number) => patch({ page: String(p) }),
    onPageSizeChange: (n: number) => patch({ limit: String(n), page: null }),
  };

  return { searchParams, page, limit, q, orderBy, sort, patch, setQuery: (v: string) => patch({ q: v || null, page: null }), tableProps };
}
