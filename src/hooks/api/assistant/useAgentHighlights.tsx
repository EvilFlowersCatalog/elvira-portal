import type { IAgentAnnotation } from '@evilflowers/evilflowersviewer';
import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

/** An agent annotation as `/assistant/v1/highlights` returns it (IP-018). */
interface IAgentAnnotationResponse {
  id: string;
  title: string;
  prompt: string | null;
  summary: string | null;
  status: 'pending' | 'done' | 'failed';
  unresolved_count: number | null;
  highlights: {
    id: string;
    seq: number;
    page: number;
    quads: { x0: number; y0: number; x1: number; y1: number }[];
    text: string;
    note: string | null;
  }[];
}

/** How often a pending annotation is polled, and for how long at most. */
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

const toViewer = (annotation: IAgentAnnotationResponse): IAgentAnnotation => ({
  id: annotation.id,
  title: annotation.title,
  prompt: annotation.prompt ?? '',
  summary: annotation.summary,
  status: annotation.status,
  unresolvedCount: annotation.unresolved_count ?? undefined,
  highlights: annotation.highlights.map((highlight) => ({
    id: highlight.id,
    seq: highlight.seq,
    page: highlight.page,
    quads: highlight.quads,
    text: highlight.text,
    note: highlight.note,
  })),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Agent highlights: the assistant marks the passages of the open copy that answer a request. */
const useAgentHighlights = () => {
  const axios = useAxios();

  const getAgentAnnotations = async (userAcquisitionId: string): Promise<IAgentAnnotation[]> => {
    const { data } = await axios.get<{ response: IAgentAnnotationResponse[] }>(`${ASSISTANT_URL}/highlights`, {
      params: { user_acquisition_id: userAcquisitionId },
    });
    return data.response.map(toViewer);
  };

  const getAgentAnnotation = async (id: string): Promise<IAgentAnnotation> => {
    const { data } = await axios.get<{ response: IAgentAnnotationResponse }>(`${ASSISTANT_URL}/highlights/${id}`);
    return toViewer(data.response);
  };

  /** Requests highlights and resolves once the background agent has finished. */
  const requestAgentAnnotation = async (
    userAcquisitionId: string,
    prompt: string,
    language?: string
  ): Promise<IAgentAnnotation> => {
    const { data } = await axios.post<{ response: IAgentAnnotationResponse }>(`${ASSISTANT_URL}/highlights`, {
      user_acquisition_id: userAcquisitionId,
      prompt,
      language,
    });

    let annotation = toViewer(data.response);
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (annotation.status === 'pending' && Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      annotation = await getAgentAnnotation(annotation.id);
    }
    if (annotation.status !== 'done') throw new Error(`Agent annotation ${annotation.id} ${annotation.status}`);
    return annotation;
  };

  return { getAgentAnnotations, requestAgentAnnotation };
};

export default useAgentHighlights;
