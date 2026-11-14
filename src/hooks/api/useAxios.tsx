import { MutableRefObject } from 'react';
import axios, { CancelTokenSource } from 'axios';

/** Default request timeout: a hung request surfaces as an error after this, not after minutes. */
export const DEFAULT_TIMEOUT = 30 * 1000;
/**
 * For requests that legitimately run long — file uploads and downloads, and calls that wait on the
 * model (explain, AI highlights) or start text extraction. Pass it per request: `{ timeout: LONG_TIMEOUT }`.
 */
export const LONG_TIMEOUT = 5 * 60 * 1000;

// Shared axios instance. Also imported directly (e.g. login / useGetMe).
export const baseAxios = axios.create({
  baseURL: import.meta.env.ELVIRA_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Current auth state the interceptors read at request time. Kept in module
// scope (not React state) and updated synchronously by AuthProvider so the
// interceptors below can be registered exactly ONCE at import time — before any
// component effect or query fires. Previously every `useAxios()` consumer
// (60+ hooks) registered its own interceptor pair on mount, so a single 401
// fanned out into N `logout()` calls and each request carried N duplicates.
interface AxiosAuthState {
  token?: string;
  logout: () => void;
  cancelTokenSource?: MutableRefObject<CancelTokenSource>;
}

const authState: AxiosAuthState = {
  logout: () => {},
};

/** Called from AuthProvider render to keep the interceptors' auth current. */
export const setAxiosAuth = (next: Partial<AxiosAuthState>) => {
  Object.assign(authState, next);
};

baseAxios.interceptors.request.use(
  (config) => {
    // When logout cancels, every in-flight request is aborted via this token.
    if (authState.cancelTokenSource) {
      config.cancelToken = authState.cancelTokenSource.current.token;
    }
    if (authState.token) {
      config.headers['Authorization'] = `Bearer ${authState.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

baseAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) authState.logout();
    return Promise.reject(error);
  }
);

/**
 * Returns the shared axios instance. Interceptors are registered once at module
 * load and read auth via `setAxiosAuth`, so this is just an accessor kept for
 * the 75 call sites that expect a hook.
 */
const useAxios = () => baseAxios;

export default useAxios;
