import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { Metadata } from '../../../utils/interfaces/general/general';
import {
  IEntrySyncSource,
  IExternalSystem,
  IHarvestConflict,
  IHarvestConflictQuery,
  IHarvestConnector,
  IHarvestProbe,
  IHarvestRecord,
  IHarvestRecordQuery,
  IHarvestSource,
  IHarvestSourceDetail,
  IHarvestSourcePayload,
  IHarvestSourceQuery,
  IOaiStatus,
} from '../../../utils/interfaces/harvest';

// IP-033/IP-034 (#51–#54). Every `harvest/*` endpoint needs `manage` on the source's catalog (or superuser) and
// answers 404 for a source the caller cannot manage. Runs are jobs (`harvest.run`), see hooks/api/jobs/useJobs.ts.

/** Drops empty values; arrays become repeated params (`status=a&status=b`), as the record filter expects. */
const toParams = (query: object) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.set(key, String(value));
  }
  return params;
};

export const HARVEST_KEY = ['harvest'] as const;

/** `GET /api/v1/harvest/connectors` — static per deployment. */
export const useHarvestConnectors = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'connectors'],
    staleTime: Infinity,
    queryFn: async ({ signal }) =>
      (await axios.get<{ response: IHarvestConnector[] }>('/api/v1/harvest/connectors', { signal })).data.response,
  });
};

/** `GET /api/v1/external-systems` — the identifier keys a record can be linked through, with their URL templates. */
export const useExternalSystems = (enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'external-systems'],
    enabled,
    staleTime: Infinity,
    // Readers may not be allowed to list them; the reader links then simply don't show.
    retry: false,
    queryFn: async ({ signal }) =>
      (await axios.get<{ response: IExternalSystem[] }>('/api/v1/external-systems', { signal })).data.response,
  });
};

export const useHarvestSources = (query: IHarvestSourceQuery, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'sources', query],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (
        await axios.get<{ items: IHarvestSource[]; metadata: Metadata }>('/api/v1/harvest/sources', {
          params: toParams(query),
          signal,
        })
      ).data,
  });
};

export const useHarvestSource = (id: string | undefined, options: { poll?: number | false } = {}) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'source', id],
    enabled: !!id,
    refetchInterval: options.poll ?? false,
    queryFn: async ({ signal }) =>
      (await axios.get<{ response: IHarvestSourceDetail }>(`/api/v1/harvest/sources/${id}`, { signal })).data.response,
  });
};

export const useHarvestRecords = (sourceId: string | undefined, query: IHarvestRecordQuery, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'records', sourceId, query],
    enabled: !!sourceId && enabled,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (
        await axios.get<{ items: IHarvestRecord[]; metadata: Metadata }>(`/api/v1/harvest/sources/${sourceId}/records`, {
          params: toParams(query),
          signal,
        })
      ).data,
  });
};

/** Imperative calls: save, delete, test, upload. Each refreshes the harvest queries it can change. */
export const useHarvestClient = () => {
  const axios = useAxios();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: HARVEST_KEY });
  return {
    create: async (body: IHarvestSourcePayload) => {
      const { data } = await axios.post<{ response: IHarvestSourceDetail }>('/api/v1/harvest/sources', body);
      refresh();
      return data.response;
    },
    update: async (id: string, body: IHarvestSourcePayload) => {
      const { data } = await axios.put<{ response: IHarvestSourceDetail }>(`/api/v1/harvest/sources/${id}`, body);
      refresh();
      return data.response;
    },
    remove: async (id: string) => {
      await axios.delete(`/api/v1/harvest/sources/${id}`);
      refresh();
    },
    /** Writes nothing on the catalog side. */
    test: async (id: string) =>
      (await axios.post<{ response: IHarvestProbe }>(`/api/v1/harvest/sources/${id}/test`)).data.response,
    upload: async (id: string, file: File) => {
      const body = new FormData();
      body.append('file', file);
      const { data } = await axios.post<{ response: IHarvestSourceDetail }>(`/api/v1/harvest/sources/${id}/upload`, body);
      refresh();
      return data.response;
    },
  };
};

// -- conflicts (#53) -----------------------------------------------------------------------------------------

export const useHarvestConflicts = (query: IHarvestConflictQuery, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'conflicts', query],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (
        await axios.get<{ items: IHarvestConflict[]; metadata: Metadata }>('/api/v1/harvest/conflicts', {
          params: toParams(query),
          signal,
        })
      ).data,
  });
};

/** Unacknowledged conflicts, for the nav badge: one row, read `metadata.total`. */
export const useOpenConflictCount = (enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'conflicts', 'open-count'],
    enabled,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) =>
      (
        await axios.get<{ items: IHarvestConflict[]; metadata: Metadata }>('/api/v1/harvest/conflicts', {
          params: { acknowledged: 'false', limit: 1 },
          signal,
        })
      ).data.metadata.total,
  });
};

/** `POST …/conflicts/{id}/acknowledge` for one or many (idempotent); settles every one, then refreshes. */
export const useAcknowledgeConflicts = () => {
  const axios = useAxios();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => axios.post<{ response: IHarvestConflict }>(`/api/v1/harvest/conflicts/${id}/acknowledge`))
      );
      return { ok: results.filter((r) => r.status === 'fulfilled').length, failed: results.filter((r) => r.status === 'rejected').length };
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: [...HARVEST_KEY, 'conflicts'] });
      client.invalidateQueries({ queryKey: [...HARVEST_KEY, 'entry-sync'] });
    },
  });
};

// -- entry (#52) ---------------------------------------------------------------------------------------------

/**
 * `GET /api/v1/entries/{id}/sync` — managers only: 403 for readers, 404 when invisible. Both mean "nothing to show",
 * so they resolve to an empty list instead of an error.
 */
export const useEntrySync = (entryId: string | undefined, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'entry-sync', entryId],
    enabled: !!entryId && enabled,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return (
          await axios.get<{ response: { sources: IEntrySyncSource[] } }>(`/api/v1/entries/${entryId}/sync`, { signal })
        ).data.response.sources;
      } catch (e: any) {
        if ([403, 404].includes(e?.response?.status)) return [] as IEntrySyncSource[];
        throw e;
      }
    },
  });
};

// -- OAI-PMH (#54) -------------------------------------------------------------------------------------------

/** `GET /api/v1/oai/status` — superusers and catalog managers. */
export const useOaiStatus = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: [...HARVEST_KEY, 'oai-status'],
    retry: false,
    queryFn: async ({ signal }) => (await axios.get<{ response: IOaiStatus }>('/api/v1/oai/status', { signal })).data.response,
  });
};
