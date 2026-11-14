import useAppContext from '../../contexts/useAppContext';
import useAxios from '../useAxios';
import { AiMessage } from '../../../providers/AppProvider';
import { IAssistantFeedback } from '../../../utils/interfaces/assistant';
import { ASSISTANT_URL } from './assistantApi';

/**
 * Rates an answer of the open chat (IP-030 Q13): `POST …/messages/{id}/feedback`. The answer's stored id comes
 * from the stream's `done` frame (EvilFlowersCatalog#145), or from the row itself for a chat read back.
 */
const useAnswerFeedback = () => {
  const axios = useAxios();
  const { aiChatId, setAiMessages } = useAppContext();

  return async (msg: AiMessage, feedback: IAssistantFeedback): Promise<void> => {
    const { serverId } = msg;
    if (!serverId || !aiChatId) throw new Error('answer-not-stored');
    await axios.post(`${ASSISTANT_URL}/chats/${aiChatId}/messages/${serverId}/feedback`, {
      rating: feedback.rating,
      ...(feedback.reason ? { reason: feedback.reason } : {}),
    });
    setAiMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, feedback } : m)));
  };
};

export default useAnswerFeedback;
