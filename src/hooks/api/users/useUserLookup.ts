import { useEffect, useState } from 'react';
import { IUser } from '../../../utils/interfaces/user';
import useGetUserDetails from './useGetUserDetails';

// Shared across tables for the session: a user shown in loans is usually the
// same one shown in reservations or grants a click later.
const cache = new Map<string, Promise<IUser | null>>();

/** Drop a cached user after it was edited or deleted. */
export const forgetUser = (id: string) => cache.delete(id);

/**
 * Resolves user ids to users for the rows currently on screen. Replaces the old
 * "download every user to build an id → name map" approach, which did not scale
 * past a few hundred accounts.
 */
export default function useUserLookup(ids: (string | undefined | null)[]): Record<string, IUser> {
  const getUserDetails = useGetUserDetails();
  const [users, setUsers] = useState<Record<string, IUser>>({});
  const key = [...new Set(ids.filter(Boolean) as string[])].sort().join(',');

  useEffect(() => {
    if (!key) return;
    let alive = true;
    key.split(',').forEach((id) => {
      if (!cache.has(id)) cache.set(id, getUserDetails(id).catch(() => null));
      cache.get(id)!.then((user) => {
        if (alive && user) setUsers((prev) => (prev[id] ? prev : { ...prev, [id]: user }));
      });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return users;
}
