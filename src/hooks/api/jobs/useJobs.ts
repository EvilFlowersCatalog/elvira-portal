import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { Metadata } from '../../../utils/interfaces/general/general';
import {
  ACTIVE_JOB_STATES,
  IJob,
  IJobApply,
  IJobDetail,
  IJobKind,
  IJobPlan,
  IJobQuery,
  IJobRun,
  IJobRunQuery,
  IJobSummaryRow,
} from '../../../utils/interfaces/jobs';

/** While something shown is on its way, lists and the drawer refresh on their own. */
export const JOBS_POLL_MS = 8000;

const params = (query: object) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''));

const isActive = (job?: Pick<IJob, 'state'> | null) => !!job && ACTIVE_JOB_STATES.includes(job.state);

/** `GET /api/v1/jobs` — one job per kind and subject. */
export const useJobs = (query: IJobQuery, options: { enabled?: boolean; poll?: boolean } = {}) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['jobs', 'list', query],
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data } = await axios.get<{ items: IJob[]; metadata: Metadata }>('/api/v1/jobs', { params: params(query), signal });
      return data;
    },
    refetchInterval: (q) => (options.poll !== false && q.state.data?.items.some(isActive) ? JOBS_POLL_MS : false),
  });
};

/** `GET /api/v1/jobs/summary` — counts per kind and state, under the list's filters. */
export const useJobSummary = (query: Omit<IJobQuery, 'page' | 'limit' | 'order_by' | 'state'> = {}) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['jobs', 'summary', query],
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async ({ signal }) =>
      (await axios.get<{ response: IJobSummaryRow[] }>('/api/v1/jobs/summary', { params: params(query), signal })).data.response,
  });
};

/** `GET /api/v1/jobs/kinds` — what each kind is, its subject and spec. Static per deployment. */
export const useJobKinds = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['jobs', 'kinds'],
    staleTime: Infinity,
    queryFn: async ({ signal }) => (await axios.get<{ response: IJobKind[] }>('/api/v1/jobs/kinds', { signal })).data.response,
  });
};

/** `GET /api/v1/jobs/{id}` — runs, run counts per task, transitions, consequences. */
export const useJob = (id: string | null | undefined) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['jobs', 'detail', id],
    enabled: !!id,
    queryFn: async ({ signal }) => (await axios.get<{ response: IJobDetail }>(`/api/v1/jobs/${id}`, { signal })).data.response,
    refetchInterval: (q) => (isActive(q.state.data) ? JOBS_POLL_MS : false),
  });
};

/** `GET /api/v1/jobs/runs` — Celery task executions, a job's follow-up tasks included. */
export const useJobRuns = (query: IJobRunQuery, options: { enabled?: boolean; poll?: boolean } = {}) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['jobs', 'runs', query],
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data } = await axios.get<{ items: IJobRun[]; metadata: Metadata }>('/api/v1/jobs/runs', { params: params(query), signal });
      return data;
    },
    refetchInterval: (q) =>
      options.poll && q.state.data?.items.some((r) => ['queued', 'received', 'started', 'retrying'].includes(r.status)) ? JOBS_POLL_MS : false,
  });
};

/** Imperative calls, for bulk actions and dry-run previews. */
export const useJobsClient = () => {
  const axios = useAxios();
  return {
    apply: async (body: IJobApply, signal?: AbortSignal) =>
      (await axios.post<{ response: IJob }>('/api/v1/jobs', body, { signal })).data.response,
    plan: async (body: IJobApply, signal?: AbortSignal) =>
      (await axios.post<{ response: IJobPlan }>('/api/v1/jobs', body, { params: { dry_run: 'true' }, signal })).data.response,
    patch: async (id: string, body: Pick<IJobApply, 'spec' | 'desired_state'>, signal?: AbortSignal) =>
      (await axios.patch<{ response: IJob }>(`/api/v1/jobs/${id}`, body, { signal })).data.response,
  };
};

/** Refresh everything a job change can move: job lists, the per-publication views and the dashboard. */
export const useInvalidateJobs = () => {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['jobs'] });
    client.invalidateQueries({ queryKey: ['entry-encryption'] });
    client.invalidateQueries({ queryKey: ['entry-extraction'] });
    client.invalidateQueries({ queryKey: ['entries'] });
    client.invalidateQueries({ queryKey: ['admin-statistics'] });
  };
};

/** Apply (run again) or cancel one job; refreshes when it lands. */
export const useJobAction = () => {
  const api = useJobsClient();
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: async (action: { type: 'apply'; body: IJobApply } | { type: 'cancel'; id: string }) =>
      action.type === 'apply' ? api.apply(action.body) : api.patch(action.id, { desired_state: 'cancelled' }),
    onSettled: invalidate,
  });
};
