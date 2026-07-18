import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { MdExpandMore, MdExpandLess, MdBlock, MdCheckCircle } from 'react-icons/md';
import useGetAIUsers, { IAIUser } from '../../hooks/api/ai-admin/useGetAIUsers';
import useGetAIUserChats, { IAIUserChat } from '../../hooks/api/ai-admin/useGetAIUserChats';
import useGetAIUserChatHistory, { IAIChatMessage } from '../../hooks/api/ai-admin/useGetAIUserChatHistory';
import useBlockAIUser from '../../hooks/api/ai-admin/useBlockAIUser';
import { PageHeader, StatusChip, IconButton } from '../../components/admin';

const LIMIT = 25;

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
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getAIUsers({ page, limit: LIMIT });
      setUsers(result.users || []);
      setTotal(result.total || 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleUserExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedChat(null);
      return;
    }
    setExpandedUser(userId);
    setExpandedChat(null);
    if (!userChats[userId]) {
      try {
        const result = await getAIUserChats(userId);
        setUserChats((prev) => ({ ...prev, [userId]: result.chats || [] }));
      } catch {
        setUserChats((prev) => ({ ...prev, [userId]: [] }));
      }
    }
  };

  const toggleChatExpand = async (userId: string, chatId: string) => {
    if (expandedChat === chatId) {
      setExpandedChat(null);
      return;
    }
    setExpandedChat(chatId);
    const key = `${userId}-${chatId}`;
    if (!chatMessages[key]) {
      try {
        const result = await getAIUserChatHistory(userId, chatId);
        setChatMessages((prev) => ({ ...prev, [key]: result.history || [] }));
      } catch {
        setChatMessages((prev) => ({ ...prev, [key]: [] }));
      }
    }
  };

  const handleBlockToggle = async (userId: string, currentBlocked: boolean) => {
    try {
      await blockAIUser(userId, !currentBlocked);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, blocked: !currentBlocked } : u)));
      if (!currentBlocked) {
        setExpandedUser(null);
        setExpandedChat(null);
      }
    } catch {
      toast.error(t('administration.aiUsersPage.blockError'));
    }
  };

  const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : t('administration.aiUsersPage.never'));

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.aiUsersPage.title')}
        description={t('administration.aiUsersPage.description')}
      />

      <div className="px-5">
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-2.5">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {total.toLocaleString()} {t('administration.aiUsersPage.total')}
            </span>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-1 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {t('administration.aiUsersPage.prev')}
              </button>
              <span className="tabular-nums">{t('administration.aiUsersPage.page', { page })}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * LIMIT >= total}
                className="rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-1 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {t('administration.aiUsersPage.next')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-6 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-700/50" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm text-redText dark:text-red">{t('administration.aiUsersPage.loadError')}</p>
              <button onClick={fetchUsers} className="mt-3 text-sm font-medium text-primaryText dark:text-primaryLight hover:underline">
                {t('administration.aiUsersPage.retry')}
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t('administration.aiUsersPage.empty')}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
              {users.map((user) => {
                const open = expandedUser === user.id;
                const name = user.username || '—';
                return (
                  <li key={user.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <IconButton
                        label={open ? t('administration.aiUsersPage.collapseUser', { name }) : t('administration.aiUsersPage.expandUser', { name })}
                        variant="ghost"
                        aria-expanded={open}
                        onClick={() => toggleUserExpand(user.id)}
                      >
                        {open ? <MdExpandLess size={22} /> : <MdExpandMore size={22} />}
                      </IconButton>

                      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                        <Stat label={t('administration.aiUsersPage.username')} value={<span className="font-semibold text-secondary dark:text-secondaryLight">{name}</span>} />
                        <Stat label={t('administration.aiUsersPage.chats')} value={user.chatCount ?? 0} />
                        <Stat label={t('administration.aiUsersPage.messages')} value={user.messageCount ?? 0} />
                        <Stat label={t('administration.aiUsersPage.tokens')} value={(user.totalTokens ?? 0).toLocaleString()} />
                        <Stat label={t('administration.aiUsersPage.lastActivity')} value={fmtDate(user.lastActivity)} />
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusChip variant={user.blocked ? 'danger' : 'success'}>
                          {user.blocked ? t('administration.aiUsersPage.blocked') : t('administration.aiUsersPage.active')}
                        </StatusChip>
                        <button
                          onClick={() => handleBlockToggle(user.id, user.blocked)}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                            user.blocked
                              ? 'bg-green/15 text-greenText dark:text-green hover:bg-green/25'
                              : 'bg-red/10 text-redText dark:text-red hover:bg-red/20'
                          }`}
                        >
                          {user.blocked ? <MdCheckCircle size={16} /> : <MdBlock size={16} />}
                          {user.blocked ? t('administration.aiUsersPage.unblock') : t('administration.aiUsersPage.block')}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="ml-2 mt-4 sm:ml-11">
                        <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          {t('administration.aiUsersPage.chatsHeading', { count: userChats[user.id]?.length ?? 0 })}
                        </p>
                        {!userChats[user.id] || userChats[user.id].length === 0 ? (
                          <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">{t('administration.aiUsersPage.noChats')}</p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {userChats[user.id].map((chat) => {
                              const chatOpen = expandedChat === chat.chatId;
                              const key = `${user.id}-${chat.chatId}`;
                              return (
                                <li key={chat.chatId} className="rounded-lg border border-zinc-200 dark:border-zinc-700">
                                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                                    <button
                                      onClick={() => toggleChatExpand(user.id, chat.chatId)}
                                      aria-expanded={chatOpen}
                                      className="flex flex-1 items-center gap-2 text-left"
                                    >
                                      {chatOpen ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                                        {chat.title || t('administration.aiUsersPage.untitledChat')}
                                      </span>
                                    </button>
                                    <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                      <span>{t('administration.aiUsersPage.msgsShort', { count: chat.messageCount ?? 0 })}</span>
                                      <span>{t('administration.aiUsersPage.tokensShort', { count: chat.totalTokens ?? 0 })}</span>
                                      <span>{fmtDate(chat.startedAt)}</span>
                                    </div>
                                  </div>

                                  {chatOpen && (
                                    <div className="max-h-96 space-y-2 overflow-y-auto border-t border-zinc-200 dark:border-zinc-700 p-3">
                                      {!chatMessages[key] || chatMessages[key].length === 0 ? (
                                        <p className="p-2 text-sm text-zinc-500 dark:text-zinc-400">{t('administration.aiUsersPage.noMessages')}</p>
                                      ) : (
                                        chatMessages[key].map((message) => (
                                          <div
                                            key={`${message.id}-${message.timestamp}`}
                                            className={`rounded-lg p-2 ${
                                              message.sender === 'user'
                                                ? 'ml-4 bg-primaryLight/60 dark:bg-primaryDark/40'
                                                : 'mr-4 bg-zinc-100 dark:bg-zinc-700/40'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                                {message.sender === 'user'
                                                  ? t('administration.aiUsersPage.roleUser')
                                                  : t('administration.aiUsersPage.roleAgent')}
                                              </span>
                                              <span className="text-xs text-zinc-400">
                                                {message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}
                                                {message.tokenUsage ? ` • ${message.tokenUsage}` : ''}
                                              </span>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-200">
                                              {message.text || t('administration.aiUsersPage.noContent')}
                                            </p>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-700 dark:text-zinc-200">{value}</div>
    </div>
  );
}

export default AdminAIUsers;
