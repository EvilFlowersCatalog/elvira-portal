import { useEffect } from 'react';
import useAuth from '../contexts/useAuthContext';
import axios from 'axios';

// Used in login
export const baseAxios = axios.create({
  baseURL: import.meta.env.ELVIRA_BASE_URL,
  timeout: 5 * 60 * 1000,
  headers: { 'Content-Type': 'application/json' },
});

const useAxios = () => {
  const { auth, logout, cancelTokenSource } = useAuth();

  useEffect(() => {
    // Setting request interceptor
    const requestIntercept = baseAxios.interceptors.request.use(
      (config) => {
        // When called, cancel all requests
        config.cancelToken = cancelTokenSource.current.token;

        // If auth token exist set it as authorization
        if (auth?.token) {
          config.headers['Authorization'] = `Bearer ${auth.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setting response interceptor
    const responseIntercept = baseAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        // If error status is 401 => logout
        if (status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Clearing
    return () => {
      baseAxios.interceptors.request.eject(requestIntercept);
      baseAxios.interceptors.response.eject(responseIntercept);
    };
  }, [auth]);

  return baseAxios;
};

export default useAxios;
