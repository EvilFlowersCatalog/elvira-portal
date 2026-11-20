import useAxios, { LONG_TIMEOUT } from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';
import { startAssistantTimer } from '../../../lib/analytics';

export interface IExplainPassage {
  user_acquisition_id: string;
  text: string;
  page?: number;
  language?: string;
}

export interface IExplanation {
  simple: string;
  examples: { label: string; description: string }[];
  /** Pages the explanation was drawn from. */
  pages: number[];
}

const useExplainPassage = () => {
  const axios = useAxios();

  /** `signal` cancels the request (the viewer's Explain card closed or moved on, elvira-portal#64). */
  const explainPassage = async (body: IExplainPassage, options?: { signal?: AbortSignal }): Promise<IExplanation> => {
    // The reader's wait, as a Faro measurement (#59). Not streamed, so total_ms only.
    const timer = startAssistantTimer('explain');
    try {
      const { data } = await axios.post<{ response: IExplanation }>(`${ASSISTANT_URL}/explain`, body, {
        // Waits on the model, which reads pages of the copy first.
        timeout: LONG_TIMEOUT,
        signal: options?.signal,
      });
      timer.end('ok');
      return data.response;
    } catch (error) {
      // A cancelled explanation is the reader moving on, not a failure.
      if (!options?.signal?.aborted) timer.end('error');
      throw error;
    }
  };

  return explainPassage;
};

export default useExplainPassage;
