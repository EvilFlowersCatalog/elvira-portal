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

  const explainPassage = async (body: IExplainPassage): Promise<IExplanation> => {
    // The reader's wait, as a Faro measurement (#59). Not streamed, so total_ms only.
    const timer = startAssistantTimer('explain');
    try {
      const { data } = await axios.post<{ response: IExplanation }>(`${ASSISTANT_URL}/explain`, body, {
        // Waits on the model, which reads pages of the copy first.
        timeout: LONG_TIMEOUT,
      });
      timer.end('ok');
      return data.response;
    } catch (error) {
      timer.end('error');
      throw error;
    }
  };

  return explainPassage;
};

export default useExplainPassage;
