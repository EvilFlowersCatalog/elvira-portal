import { IAssistantChat, IAssistantStartChat } from '../../../utils/interfaces/assistant';
import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

const useStartChat = () => {
  const axios = useAxios();

  const startChat = async (body: IAssistantStartChat = {}): Promise<IAssistantChat> => {
    const { data } = await axios.post<{ response: IAssistantChat }>(`${ASSISTANT_URL}/chats`, body);
    return data.response;
  };

  return startChat;
};

export default useStartChat;
