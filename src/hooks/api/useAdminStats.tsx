import { useCallback } from 'react';
import useAxios from './useAxios';
import useAppContext from '../contexts/useAppContext';

export interface AdminStats {
  publications: number | null;
  collections: number | null;
  categories: number | null;
  authors: number | null;
  users: number | null;
  catalogs: number | null;
}

/**
 * Fetches lightweight totals for the admin dashboard tiles. Content resources
 * are scoped to the currently selected catalog; users/catalogs are global.
 * Each count is a `limit=1` list request read from `metadata.total`; a failed
 * count resolves to null so one bad endpoint never blanks the whole dashboard.
 */
const useAdminStats = () => {
  const axios = useAxios();
  const { selectedCatalogId } = useAppContext();

  return useCallback(async (): Promise<AdminStats> => {
    const total = async (path: string, scoped: boolean): Promise<number | null> => {
      try {
        const params = new URLSearchParams({ page: '1', limit: '1' });
        if (scoped && selectedCatalogId) params.set('catalog_id', selectedCatalogId);
        const { data } = await axios.get<{ metadata?: { total?: number } }>(`/api/v1/${path}`, { params });
        return data?.metadata?.total ?? null;
      } catch {
        return null;
      }
    };

    const [publications, collections, categories, authors, users, catalogs] = await Promise.all([
      total('entries', true),
      total('feeds', true),
      total('categories', true),
      total('authors', true),
      total('users', false),
      total('catalogs', false),
    ]);

    return { publications, collections, categories, authors, users, catalogs };
  }, [axios, selectedCatalogId]);
};

export default useAdminStats;
