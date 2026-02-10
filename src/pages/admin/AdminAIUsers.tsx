import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import useGetAIUsers, { IAIUser } from '../../hooks/api/ai-admin/useGetAIUsers';
import useGetAIUserChats, { IAIUserChat } from '../../hooks/api/ai-admin/useGetAIUserChats';
import useGetAIUserChatHistory, { IAIChatMessage } from '../../hooks/api/ai-admin/useGetAIUserChatHistory';
import useBlockAIUser from '../../hooks/api/ai-admin/useBlockAIUser';
import { MdExpandMore, MdExpandLess, MdBlock, MdCheckCircle } from 'react-icons/md';

const AdminAIUsers = () => {
  const { t } = useTranslation();
  const getAIUsers = useGetAIUsers();
  const getAIUserChats = useGetAIUserChats();
  const getAIUserChatHistory = useGetAIUserChatHistory();
  const blockAIUser = useBlockAIUser();

  const [users, setUsers] = useState<IAIUser[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [userChats, setUserChats] = useState<Record<string, IAIUserChat[]>>({});
  const [chatMessages, setChatMessages] = useState<Record<string, IAIChatMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAIUsers({ page, limit });
      console.log('Fetched AI users:', result);
      setUsers(result.users || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch AI users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const toggleUserExpand = async (userId: string) => {
    console.log('Toggling user expand for userId:', userId);
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedChat(null);
    } else {
      setExpandedUser(userId);
      setExpandedChat(null);
      if (!userChats[userId]) {
        try {
          console.log('Fetching chats for userId:', userId);
          const result = await getAIUserChats(userId);
          console.log('Fetched chats:', result);
          setUserChats(prev => ({ ...prev, [userId]: result.chats || [] }));
        } catch (error) {
          console.error('Failed to fetch user chats:', error);
        }
      }
    }
  };

  const toggleChatExpand = async (userId: string, chatId: string) => {
    console.log('Toggling chat expand for userId:', userId, 'chatId:', chatId);
    if (expandedChat === chatId) {
      setExpandedChat(null);
    } else {
      setExpandedChat(chatId);
      const key = `${userId}-${chatId}`;
      if (!chatMessages[key]) {
        try {
          console.log('Fetching messages for userId:', userId, 'chatId:', chatId);
          const result = await getAIUserChatHistory(userId, chatId);
          console.log('Fetched messages:', result);
          setChatMessages(prev => ({ ...prev, [key]: result.history || [] }));
        } catch (error) {
          console.error('Failed to fetch chat history:', error);
        }
      }
    }
  };

  const handleBlockToggle = async (userId: string, currentBlocked: boolean) => {
    try {
      await blockAIUser(userId, !currentBlocked);
      setUsers(users.map(u => u.id === userId ? { ...u, blocked: !currentBlocked } : u));
      if (!currentBlocked) {
        setExpandedUser(null);
        setExpandedChat(null);
      }
    } catch (error) {
      console.error('Failed to toggle block status:', error);
    }
  };

  return (
    <div className='overflow-auto pb-10 px-4'>
      <Breadcrumb />
      <H1>AI Users Administration</H1>
      
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow mt-4'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <span className='font-semibold text-lg'>Total AI Users: {total}</span>
            <div className='flex gap-2'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                Previous
              </button>
              <span className='px-3 py-1'>Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className='px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className='p-8 text-center'>Loading...</div>
        ) : (
          <div className='divide-y divide-gray-200 dark:divide-gray-700'>
            {users.map((user) => (
              <div key={user.id} className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4 flex-1'>
                    <button
                      onClick={() => toggleUserExpand(user.id)}
                      className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                    >
                      {expandedUser === user.id ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                    
                    <div className='grid grid-cols-5 gap-4 flex-1'>
                      <div>
                        <div className='text-xs text-gray-500'>Username</div>
                        <div className='font-semibold'>{user.username || 'N/A'}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-500'>Chats</div>
                        <div>{user.chatCount ?? 0}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-500'>Messages</div>
                        <div>{user.messageCount ?? 0}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-500'>Tokens</div>
                        <div>{(user.totalTokens ?? 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-500'>Last Activity</div>
                        <div className='text-sm'>{user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBlockToggle(user.id, user.blocked)}
                      className={`px-4 py-2 rounded flex items-center gap-2 ${
                        user.blocked 
                          ? 'bg-green-500 hover:bg-green-600 text-black' 
                          : 'bg-red-500 hover:bg-red-600 text-black'
                      }`}
                    >
                      {user.blocked ? <><MdCheckCircle /> Unblock</> : <><MdBlock /> Block</>}
                    </button>
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className='ml-10 mt-4 space-y-2'>
                    <div className='text-sm font-semibold mb-2'>Chats ({userChats[user.id]?.length || 0})</div>
                    {!userChats[user.id] || userChats[user.id].length === 0 ? (
                      <div className='text-gray-500 text-sm p-3'>No chats found</div>
                    ) : (
                      userChats[user.id].map((chat) => (
                        <div key={chat.chatId} className='border border-gray-200 dark:border-gray-600 rounded p-3'>
                          <div className='flex items-center justify-between'>
                            <button
                              onClick={() => toggleChatExpand(user.id, chat.chatId)}
                              className='flex items-center gap-2 flex-1 text-left'
                            >
                              {expandedChat === chat.chatId ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                              <span className='font-medium'>{chat.title || 'Untitled Chat'}</span>
                            </button>
                            <div className='flex gap-4 text-sm text-gray-600 dark:text-gray-400'>
                              <span>{chat.messageCount ?? 0} msgs</span>
                              <span>{chat.totalTokens ?? 0} tokens</span>
                              <span>{chat.startedAt ? new Date(chat.startedAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>

                          {expandedChat === chat.chatId && (
                            <div className='mt-3 space-y-2 max-h-96 overflow-y-auto'>
                              {!chatMessages[`${user.id}-${chat.chatId}`] || chatMessages[`${user.id}-${chat.chatId}`].length === 0 ? (
                                <div className='text-gray-500 text-sm p-2'>No messages found</div>
                              ) : (
                                chatMessages[`${user.id}-${chat.chatId}`].map((message) => (
                                  <div
                                    key={`${message.id}-${message.timestamp}`}
                                    className={`p-2 rounded ${
                                      message.sender === 'user'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-4'
                                        : 'bg-gray-50 dark:bg-gray-700/20 mr-4'
                                    }`}
                                  >
                                    <div className='flex justify-between items-start gap-2'>
                                      <div className='text-xs font-semibold text-gray-600 dark:text-gray-400'>
                                        {message.sender === 'user' ? 'User' : 'Agent'}
                                      </div>
                                      <div className='text-xs text-gray-500'>
                                        {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'N/A'}
                                        {message.tokenUsage && ` • ${message.tokenUsage} tokens`}
                                      </div>
                                    </div>
                                    <div className='text-sm mt-1 whitespace-pre-wrap break-words'>{message.text || 'No content'}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAIUsers;
