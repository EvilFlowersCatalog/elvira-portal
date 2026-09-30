import useAxios from '../useAxios';
import { ASSISTANT_URL } from './assistantApi';

const useDeleteChat = () => {
  const axios = useAxios();

  const deleteChat = async (chatId: string): Promise<void> => {
    await axios.delete(`${ASSISTANT_URL}/chats/${chatId}`);
  };

  return deleteChat;
};

export default useDeleteChat;
