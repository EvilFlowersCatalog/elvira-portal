import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import useAuthContext from '../hooks/contexts/useAuthContext';
import {
  FEATURES_SETTING_KEY,
  IPublicSettings,
  getFeatureSnapshot,
  markFeaturesSettled,
  setFeatureSnapshot,
  toStored,
} from './features';
import { config } from '@/lib/config';

/**
 * The reader-visible settings and the deployment's capabilities (EvilFlowersCatalog#212): the settings
 * listing filtered to public keys, readable without a token.
 */
export const PUBLIC_SETTINGS_PATH = '/api/v1/settings?public=true&include=capabilities';

const base = config.ELVIRA_BASE_URL.replace(/\/$/, '');

/**
 * Plain `fetch`, not the shared axios: its 401 interceptor logs the reader out, and an anonymous reader's
 * first page load must never do that because an older catalog refused the request. The public read goes
 * without a token (the catalog answers 401 to an expired one even on the public path).
 */
const getBody = async <T,>(path: string, token?: string): Promise<T | null> => {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
};

/**
 * Keeps the feature store (`features.ts`) in step with the catalog. Mounted once, above the routes.
 *
 * 1. `GET /api/v1/settings?public=true&include=capabilities` — `portal.features` and the capabilities,
 *    for every reader.
 * 2. Refused (a catalog before #212: superusers only) and the reader is a superuser: the setting itself,
 *    so an administrator still sees what they stored.
 * 3. Neither: the cached answer stays, else the build defaults.
 */
const useFeatureSync = () => {
  const { auth } = useAuthContext();
  const token = auth?.token;
  const superuser = !!auth?.isSuperUser;

  const query = useQuery({
    // Not keyed on the token: a refresh every 4 min must not refetch. The token is read when it runs.
    queryKey: ['portal-features', superuser],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () => {
      try {
        const pub = await getBody<IPublicSettings>(PUBLIC_SETTINGS_PATH);
        if (pub && Array.isArray(pub.response)) {
          const item = pub.response.find((setting) => setting.key === FEATURES_SETTING_KEY);
          return { stored: toStored(item?.value), capabilities: pub.capabilities ?? {}, fromCatalog: true };
        }
        if (superuser && token) {
          const setting = await getBody<{ response?: { value: unknown } }>(`/api/v1/settings/${FEATURES_SETTING_KEY}`, token);
          if (setting?.response) {
            return { stored: toStored(setting.response.value), capabilities: getFeatureSnapshot().capabilities, fromCatalog: true };
          }
        }
      } catch {
        // Offline or CORS: keep what we have.
      }
      return null;
    },
  });

  useEffect(() => {
    if (query.data) setFeatureSnapshot(query.data);
    if (query.isFetched) markFeaturesSettled();
  }, [query.data, query.isFetched]);
};

export default useFeatureSync;
