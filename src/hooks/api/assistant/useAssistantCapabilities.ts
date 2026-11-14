import { useQuery } from '@tanstack/react-query';
import useAxios from '../useAxios';
import useAppContext from '../../contexts/useAppContext';
import useAuthContext from '../../contexts/useAuthContext';
import { IAssistantCapabilities } from '../../../utils/interfaces/assistant';
import { ASSISTANT_URL } from './assistantApi';

/**
 * What the assistant can do here, with starter prompts, in the UI language (`GET /assistant/v1/capabilities`).
 * No model call: this replaces asking the assistant to "showcase what you can do". `entryId` adds the study
 * tools when that publication is processed and readable; `bound` adds highlighting in the viewer.
 */
const useAssistantCapabilities = (options: { entryId?: string; bound?: boolean } = {}) => {
  const axios = useAxios();
  const { lang } = useAppContext();
  const { auth } = useAuthContext();
  const { entryId, bound } = options;

  return useQuery({
    // Signed-in sessions get loans and shelf, so the user is part of the key.
    queryKey: ['assistant-capabilities', lang, entryId ?? null, !!bound, auth?.token ? 'user' : 'anonymous'],
    queryFn: async () => {
      const { data } = await axios.get<{ response: IAssistantCapabilities }>(`${ASSISTANT_URL}/capabilities`, {
        params: { language: lang, ...(entryId ? { entry_id: entryId } : {}), ...(bound ? { bound: 1 } : {}) },
      });
      return data.response;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export default useAssistantCapabilities;
