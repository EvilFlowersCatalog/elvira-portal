import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { IEntryEncryption } from '../../../utils/interfaces/encryption';

/** While a job waits for the worker, poll so the status moves on its own. */
const POLL_MS = 10_000;

/** Readium LCP encryption job of one publication (admin "Background jobs"). */
export const useEntryEncryption = (entryId: string | undefined, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['entry-encryption', entryId],
    enabled: !!entryId && enabled,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IEntryEncryption }>(`/readium/v1/entries/${entryId}/encryption`);
      return data.response;
    },
    refetchInterval: (query) => (query.state.data?.encryption?.status === 'pending' ? POLL_MS : false),
  });
};

/**
 * `POST /readium/v1/entries/{id}/encryption`. Without `force` it starts a job that does not
 * exist yet or replaces a failed one; with `force` the backend deletes the job (and its
 * encrypted file) and creates a new one under a new content id. Administrators only.
 */
export const useTriggerEncryption = (entryId: string | undefined) => {
  const axios = useAxios();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (force: boolean) => {
      const { data } = await axios.post<{ response: { lcp_content_id: string; status: string } }>(
        `/readium/v1/entries/${entryId}/encryption`,
        force ? { force: true } : {}
      );
      return data.response;
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['entry-encryption', entryId] });
      client.invalidateQueries({ queryKey: ['admin-statistics'] });
    },
  });
};
