import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import useAxios from '../useAxios';
import {
  IAssignResult,
  IContentPolicy,
  IContentPolicyVersion,
  IExplainRequest,
  IExplainResult,
  IJsonSchema,
  ISetting,
  PolicyDocument,
} from '../../../utils/interfaces/contentPolicy';

// Content policies (EvilFlowersCatalog#174) and instance settings (#20), catalog 05cf002.

const BASE = '/api/v1/content-policies';

/** The route does not exist on this catalog (an older deployment): the page says so instead of erroring. */
export const isUnavailable = (error: unknown) =>
  isAxiosError(error) && [404, 405, 501].includes(error.response?.status ?? 0);

/**
 * A refusal's message with the schema path of the error (422: `path`, `schema_path`), wherever the problem
 * document carries them (top level or under `additional_data`).
 */
export const problemOf = (error: unknown): string | null => {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return null;
  const extra = (data.additional_data ?? {}) as Record<string, unknown>;
  const detail = [data.detail, data.title, data.message].find((v) => typeof v === 'string') as string | undefined;
  const path = data.path ?? extra.path;
  const where = Array.isArray(path) ? path.join('.') : typeof path === 'string' && path ? path : null;
  if (!detail) return where;
  return where && !detail.includes(where) ? `${where}: ${detail}` : detail;
};

const retryUnlessUnavailable = (count: number, error: unknown) => !isUnavailable(error) && count < 2;

export const useContentPolicies = (enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policies'],
    enabled,
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IContentPolicy[] }>(BASE);
      return data.response ?? [];
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
      const { data } = await axios.get<{ response: IJsonSchema }>(`${BASE}/schema`);
      return data.response;
    },
  });
};

export const useContentPolicyVersions = (key: string | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policy-versions', key],
    enabled: !!key,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IContentPolicyVersion[] }>(
        `${BASE}/${encodeURIComponent(key!)}/versions`,
      );
      return data.response ?? [];
    },
  });
};

/** One stored version with its document (`?version=N`); versions never change, so it is cached for good. */
export const useContentPolicyVersion = (key: string | null, version: number | null) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['content-policy-version', key, version],
    enabled: !!key && version !== null,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IContentPolicy }>(`${BASE}/${encodeURIComponent(key!)}/versions`, {
        params: { version },
      });
      return data.response;
    },
  });
};

/**
 * Create (POST, `document.key` names it) or save a new version (PUT). `dryRun` validates only — the editor's
 * "Validate" button, so a refusal with its schema path shows before anything is written.
 */
export const useSaveContentPolicy = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ document, create, dryRun }: { document: PolicyDocument; create?: boolean; dryRun?: boolean }) => {
      const params = dryRun ? { dry_run: 'true' } : undefined;
      const { data } = create
        ? await axios.post<{ response: IContentPolicy }>(BASE, { document }, { params })
        : await axios.put<{ response: IContentPolicy }>(`${BASE}/${encodeURIComponent(document.key!)}`, { document }, { params });
      return data.response;
    },
    onSuccess: (_policy, { document, dryRun }) => {
      if (dryRun) return;
      queryClient.invalidateQueries({ queryKey: ['content-policies'] });
      queryClient.invalidateQueries({ queryKey: ['content-policy', document.key] });
      queryClient.invalidateQueries({ queryKey: ['content-policy-versions', document.key] });
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

/**
 * Point a catalog or entries at a policy; `null` clears it (`inherit`). Needs `manage` on each catalog.
 * With `dryRun` nothing changes — the catalog picker reads the current assignment that way (`catalog.previous`),
 * since catalogs don't expose `content_policy` themselves.
 */
export const useAssignContentPolicy = () => {
  const axios = useAxios();
  return useMutation({
    mutationFn: async ({
      key,
      catalogId,
      entryIds,
      dryRun,
    }: {
      key: string | null;
      catalogId?: string;
      entryIds?: string[];
      dryRun?: boolean;
    }) => {
      const { data } = await axios.post<{ response: IAssignResult }>(
        `${BASE}/${encodeURIComponent(key ?? 'inherit')}/assign`,
        { ...(catalogId ? { catalog_id: catalogId } : {}), ...(entryIds?.length ? { entry_ids: entryIds } : {}) },
        { params: dryRun ? { dry_run: 'true' } : undefined },
      );
      return data.response;
    },
  });
};

/** A catalog's current policy key (null = inherits), read through a dry-run assignment. */
export const useCatalogPolicy = (catalogId: string | null, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['catalog-content-policy', catalogId],
    enabled: enabled && !!catalogId,
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.post<{ response: IAssignResult }>(
        `${BASE}/inherit/assign`,
        { catalog_id: catalogId },
        { params: { dry_run: 'true' } },
      );
      return data.response.catalog?.previous ?? null;
    },
  });
};

// ── Instance settings (#20) ────────────────────────────────────────────────────

export const useSettings = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['settings'],
    retry: retryUnlessUnavailable,
    queryFn: async () => {
      const { data } = await axios.get<{ response: ISetting[] }>('/api/v1/settings');
      return data.response ?? [];
    },
  });
};

export const useSaveSetting = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    /** `value: null` deletes the stored value, so the `EVILFLOWERS_*` setting or the default applies again. */
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      await axios.put(`/api/v1/settings/${encodeURIComponent(key)}`, { value });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};
