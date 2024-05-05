import { useEffect, useState } from 'react';
import useAuth from '../../contexts/useAuthContext';
import axios from 'axios';

// Used in login
export const baseAxios = axios.create({
  baseURL: import.meta.env.ELVIRA_BASE_URL,
  timeout: 5 * 60 * 1000,
  headers: { 'Content-Type': 'application/json' },
});

const useAxios = () => {
  const { auth, logout } = useAuth();
  const [render, setRender] = useState<boolean>(false);

  useEffect(() => {
    // Skip initial render
    if (!render) {
      setRender(true);
      return;
    }

    // Setting request interceptor
    const requestIntercept = baseAxios.interceptors.request.use(
      (config) => {
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
  }, [auth, render]);

  return baseAxios;
};

export default useAxios;
