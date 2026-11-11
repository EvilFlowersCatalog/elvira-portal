import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  format,
  startOfISOWeek,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import useAxios from '../useAxios';
import {
  IAdminStatistics,
  IStatisticsParams,
  StatsBucket,
} from '../../../utils/interfaces/statistics';

export type StatsRange = '7d' | '30d' | '90d' | '12m';
export const STATS_RANGES: StatsRange[] = ['7d', '30d', '90d', '12m'];

const BUCKET: Record<StatsRange, StatsBucket> = {
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  '12m': 'month',
};

export const rangeToParams = (
  range: StatsRange,
  now = new Date()
): IStatisticsParams => {
  const to = now;
  // Start on a bucket boundary so only the current (last) bucket can be partial.
  const from =
    range === '12m'
      ? startOfMonth(subMonths(to, 11))
      : range === '90d'
        ? startOfISOWeek(subDays(to, 89))
        : subDays(to, Number(range.replace('d', '')) - 1);
  return {
    catalog_id: import.meta.env.ELVIRA_CATALOG_ID,
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    bucket: BUCKET[range],
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Bratislava',
  };
};

export type AdminStatisticsResult =
  | { status: 'live'; data: IAdminStatistics }
  /** Local dev server only: the endpoint is missing, so a generated fixture is shown under a badge. */
  | { status: 'demo'; data: IAdminStatistics }
  /** The backend does not serve `/api/v1/statistics` yet. */
  | { status: 'unavailable' };

/**
 * Operational analytics for the admin dashboard (`GET /api/v1/statistics`,
 * specified in EvilFlowersCatalog/EvilFlowersCatalog#131).
 * A 404 is an expected state until the backend ships the endpoint — it resolves
 * to `unavailable` instead of throwing, so the page can explain itself. Under the
 * local Vite dev server that same 404 swaps in a deterministic fixture so the
 * charts can be explored. No `vite build` output includes it (verified for both
 * `--mode production` and `--mode development`).
 */
const useAdminStatistics = (range: StatsRange) => {
  const axios = useAxios();
  const params = rangeToParams(range);

  return useQuery<AdminStatisticsResult>({
    queryKey: ['admin-statistics', params],
    queryFn: async () => {
      try {
        const { data } = await axios.get<{ response: IAdminStatistics }>(
          '/api/v1/statistics',
          { params }
        );
        return { status: 'live', data: data.response };
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
          if (import.meta.env.DEV) {
            const { buildStatisticsFixture } =
              await import('./statisticsFixture');
            return { status: 'demo', data: buildStatisticsFixture(params) };
          }
          return { status: 'unavailable' };
        }
        throw err;
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: (count, err) =>
      !(
        isAxiosError(err) &&
        err.response?.status &&
        err.response.status < 500
      ) && count < 2,
  });
};

export default useAdminStatistics;
