import useAxios, { LONG_TIMEOUT } from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

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
    const { data } = await axios.post<{ response: IExplanation }>(`${ASSISTANT_URL}/explain`, body, {
      // Waits on the model, which reads pages of the copy first.
      timeout: LONG_TIMEOUT,
    });
    return data.response;
  };

  return explainPassage;
};

export default useExplainPassage;
