import { IAssistantChatList, IAssistantChatQuery } from '../../../utils/interfaces/assistant';
import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

const useGetUserChats = () => {
  const axios = useAxios();

  const getUserChats = async ({ page, limit, orderBy }: IAssistantChatQuery = {}): Promise<IAssistantChatList> => {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    // Newest first is the backend default; only override when asked to.
    if (orderBy) params.set('order_by', orderBy);

    const { data } = await axios.get<IAssistantChatList>(`${ASSISTANT_URL}/chats`, { params });
    return data;
  };

  return getUserChats;
};

export default useGetUserChats;
