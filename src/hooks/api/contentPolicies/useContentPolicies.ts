import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import useAxios from '../useAxios';
import {
  IContentPolicy,
  IContentPolicyVersion,
  IExplainRequest,
  IExplainResult,
  IJsonSchema,
  ISetting,
  PolicyDocument,
} from '../../../utils/interfaces/contentPolicy';

// Content policies (EvilFlowersCatalog#174) and settings (#20). Contract: docs/content-policies-admin.md.

const BASE = '/api/v1/content-policies';

/** The route does not exist on this catalog yet (404 / 405 / 501): the page says so instead of erroring. */
export const isUnavailable = (error: unknown) =>
  isAxiosError(error) && [404, 405, 501].includes(error.response?.status ?? 0);

/** A list answered as an array, as `{items}` or as `{results}`. */
const listOf = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const o = data as { items?: unknown; results?: unknown };
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.results)) return o.results as T[];
  }
  return [];
};

/** A validation error's message with its schema path, when the catalog sends one (`path`, `loc`, `errors`). */
export const problemOf = (error: unknown): string | null => {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const detail = typeof data.detail === 'string' ? data.detail : typeof data.title === 'string' ? data.title : null;
  const errors = Array.isArray(data.errors) ? (data.errors as Record<string, unknown>[]) : [];
  const paths = errors
    .map((e) => {
      const path = Array.isArray(e.path) ? e.path.join('.') : Array.isArray(e.loc) ? e.loc.join('.') : e.path;
      const message = e.message ?? e.msg;
      return path ? `${path}: ${message ?? ''}` : (message as string | undefined);
    })
    .filter(Boolean);
  return [detail, ...paths].filter(Boolean).join(' — ') || null;
};

const retryUnlessUnavailable = (count: number, error: unknown) => !isUnavailable(error) && count < 2;

export const useContentPolicies = (enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policies'],
    enabled,
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.get<{ response: unknown }>(BASE);
      return listOf<IContentPolicy>(data.response);
    },
  });
};

export const useContentPolicy = (key: string | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policy', key],
    enabled: !!key,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IContentPolicy }>(`${BASE}/${encodeURIComponent(key!)}`);
      return data.response;
    },
  });
};

export const useContentPolicySchema = (enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policy-schema'],
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.get<{ response?: IJsonSchema } & IJsonSchema>(`${BASE}/schema`);
      // The schema may come wrapped like every response, or bare.
      return (data.response ?? data) as IJsonSchema;
    },
  });
};

export const useContentPolicyVersions = (key: string | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policy-versions', key],
    enabled: !!key,
    queryFn: async () => {
      const { data } = await axios.get<{ response: unknown }>(`${BASE}/${encodeURIComponent(key!)}/versions`);
      return listOf<IContentPolicyVersion>(data.response).sort((a, b) => b.version - a.version);
    },
  });
};

export const useSaveContentPolicy = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      title,
      document,
      create,
    }: {
      key: string;
      title: string;
      document: PolicyDocument;
      create?: boolean;
    }) => {
      const body = { key, title, document };
      const { data } = create
        ? await axios.post<{ response: IContentPolicy }>(BASE, body)
        : await axios.put<{ response: IContentPolicy }>(`${BASE}/${encodeURIComponent(key)}`, body);
      return data.response;
    },
    onSuccess: (_policy, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['content-policies'] });
      queryClient.invalidateQueries({ queryKey: ['content-policy', key] });
      queryClient.invalidateQueries({ queryKey: ['content-policy-versions', key] });
    },
  });
};

export const useExplainAccess = () => {
  const axios = useAxios();
  return useMutation({
    mutationFn: async (body: IExplainRequest) => {
      const { data } = await axios.post<{ response: IExplainResult }>(`${BASE}/explain`, body);
      return data.response;
    },
  });
};

// ── Settings (#20) ─────────────────────────────────────────────────────────────

export const useSettings = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['settings'],
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.get<{ response: unknown }>('/api/v1/settings');
      return listOf<ISetting>(data.response);
    },
  });
};

export const useSaveSetting = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    /** `reset` drops the stored value, so the environment or the built-in default applies again. */
    mutationFn: async ({ key, value, reset }: { key: string; value?: unknown; reset?: boolean }) => {
      const url = `/api/v1/settings/${encodeURIComponent(key)}`;
      if (reset) await axios.delete(url);
      else await axios.put(url, { value });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};
