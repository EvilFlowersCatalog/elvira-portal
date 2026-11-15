import { useQuery } from '@tanstack/react-query';
import useAuthContext from '../../contexts/useAuthContext';
import useLicensesQuery from '../licenses/useLicensesQuery';
import useGetShelf from '../my-shelf/useGetShelf';
import useUserChatsQuery from './useUserChatsQuery';
import { LICENSE_STATE } from '../../../utils/interfaces/licenses';
import { IAssistantChat } from '../../../utils/interfaces/assistant';

/** A publication the reader has something to do with, offered as "ask about it". */
export interface IPersonalBook {
  id: string;
  title: string;
  catalogId?: string | null;
  /** Why it is offered: borrowed now (until `until`) or saved on the shelf. */
  reason: 'loan' | 'shelf';
  until?: string;
}

const MAX_BOOKS = 4;

/**
 * What an empty chat can offer this reader personally: the conversation to pick up again and the publications
 * they are reading (current loans first, then the shelf). Only fetched while the assistant is on screen and
 * someone is signed in — the drawer stays mounted on every page.
 */
const useAssistantPersonal = (active: boolean) => {
  const { auth } = useAuthContext();
  const enabled = active && !!auth;
  const getShelf = useGetShelf();

  const chats = useUserChatsQuery({ limit: 3 }, { enabled });
  const loans = useLicensesQuery({ page: 1, limit: 10, orderBy: '-starts_at' }, { enabled });
  const shelf = useQuery({
    queryKey: ['assistant-personal-shelf', auth?.userId ?? null],
    queryFn: () => getShelf({ page: 1, limit: 6, orderBy: '-created_at' }),
    enabled,
    staleTime: 60 * 1000,
  });

  const now = Date.now();
  const books: IPersonalBook[] = [];
  const add = (book: IPersonalBook) => {
    if (books.length < MAX_BOOKS && !books.some((b) => b.id === book.id)) books.push(book);
  };
  for (const license of loans.data?.items ?? []) {
    const current = license.state === LICENSE_STATE.ready || license.state === LICENSE_STATE.active;
    if (!current || !license.entry || Date.parse(license.expires_at) < now) continue;
    add({
      id: license.entry.id,
      title: license.entry.title,
      catalogId: license.entry.catalog_id,
      reason: 'loan',
      until: license.expires_at,
    });
  }
  for (const record of shelf.data?.items ?? []) {
    if (record.entry) add({ id: record.entry.id, title: record.entry.title, catalogId: record.entry.catalog_id, reason: 'shelf' });
  }

  const lastChat: IAssistantChat | undefined = chats.data?.items?.find((chat) => (chat.message_count ?? 0) > 0);

  return { enabled, books, lastChat, isLoading: enabled && (loans.isLoading || shelf.isLoading || chats.isLoading) };
};

export default useAssistantPersonal;
