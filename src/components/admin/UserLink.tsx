import { Link } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

interface UserLinkProps {
  id: string;
  /** Whatever is known about the user; the cell shows "…" until it resolves. */
  user?: { username: string; name?: string; surname?: string };
}

export const userDisplayName = (user: { username: string; name?: string; surname?: string }) =>
  `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.username;

/** A user's name linking to their admin profile. */
export default function UserLink({ id, user }: UserLinkProps) {
  if (!user) return <span className="text-zinc-400">…</span>;
  return (
    <Link
      to={`${NAVIGATION_PATHS.adminUsers}/${id}`}
      onClick={(e) => e.stopPropagation()}
      title={user.username}
      className="font-medium text-zinc-700 dark:text-zinc-200 hover:text-primaryText dark:hover:text-primaryLight hover:underline"
    >
      {userDisplayName(user)}
    </Link>
  );
}
