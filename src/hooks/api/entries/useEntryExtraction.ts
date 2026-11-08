import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAxios from '../useAxios';
import useAuthContext from '../../contexts/useAuthContext';
import { withAccessToken } from '../../../utils/func/functions';
import {
  IEntryExtraction,
  IExtractionParagraphs,
  IExtractionRegion,
} from '../../../utils/interfaces/extraction';

/** Poll while something is waiting or running, so status, jobs and queue position move on their own. */
const POLL_MS = 5000;

const isBusy = (data?: IEntryExtraction) =>
  !!data?.acquisitions.some((a) => a.status === 'queued' || a.status === 'running');

/** The AI processing of a publication, for its managers (admin "AI processing" tab). */
export const useEntryExtraction = (entryId: string | undefined, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['entry-extraction', entryId],
    enabled: !!entryId && enabled,
    queryFn: async () => {
      const { data } = await axios.get<{ response: IEntryExtraction }>(`/api/v1/entries/${entryId}/extraction`);
      return data.response;
    },
    refetchInterval: (query) => (isBusy(query.state.data) ? POLL_MS : false),
  });
};

/** Regions of one run (default: the active run, else the latest). */
export const useEntryExtractionRegions = (entryId: string | undefined, runId: string | null | undefined, enabled = true) => {
  const axios = useAxios();
  const { auth } = useAuthContext();
  return useQuery({
    queryKey: ['entry-extraction-regions', entryId, runId ?? null],
    enabled: !!entryId && enabled,
    queryFn: async () => {
      const { data } = await axios.get<{ response: { run_id: string | null; items: IExtractionRegion[] } }>(
        `/api/v1/entries/${entryId}/extraction/regions`,
        { params: runId ? { run_id: runId } : {} }
      );
      return data.response.items.map((region) => ({
        ...region,
        image_url: withAccessToken(region.image_url, auth?.token),
      }));
    },
  });
};

export interface ParagraphQuery {
  runId?: string | null;
  page: number;
  limit: number;
  query?: string;
  pdfPage?: number | null;
}

export const useEntryExtractionParagraphs = (entryId: string | undefined, q: ParagraphQuery, enabled = true) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['entry-extraction-paragraphs', entryId, q],
    enabled: !!entryId && enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = { page: q.page, limit: q.limit };
      if (q.runId) params.run_id = q.runId;
      if (q.query) params.query = q.query;
      if (q.pdfPage) params.pdf_page = q.pdfPage;
      const { data } = await axios.get<{ response: IExtractionParagraphs }>(
        `/api/v1/entries/${entryId}/extraction/paragraphs`,
        { params }
      );
      return data.response;
    },
  });
};

/** Queue the entry's PDFs (or one) for processing; `force` re-processes a finished run. */
export const useQueueEntryExtraction = (entryId: string | undefined) => {
  const axios = useAxios();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: { acquisition_id?: string; force?: boolean }) => {
      const { data } = await axios.post<{ response: IEntryExtraction }>(
        `/api/v1/entries/${entryId}/extraction`,
        body
      );
      return data.response;
    },
    onSuccess: (data) => {
      client.setQueryData(['entry-extraction', entryId], data);
      client.invalidateQueries({ queryKey: ['entry-extraction-regions', entryId] });
      client.invalidateQueries({ queryKey: ['entry-extraction-paragraphs', entryId] });
      client.invalidateQueries({ queryKey: ['entries'] });
    },
  });
};
