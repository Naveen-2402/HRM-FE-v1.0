import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getClientAuthToken,
  getClientRefreshToken,
  setAuthTokens,
  clearAuthToken
} from '@repo/utils';

// 1. Import the isolated Orval instance
import { AXIOS_INSTANCE } from '@repo/orval-config/src/axios-setup';

// ── Concurrency Queue Setup ──
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupAxiosInterceptors() {
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ── Shared Request Interceptor Logic ──
  const requestInterceptor = (config: any) => {
    const token = getClientAuthToken();

    // Your existing URL rewrite logic
    if (config.url && config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace('/api/v1/', '/');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };

  // Attach request interceptors
  axios.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
  AXIOS_INSTANCE.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

  // ── Shared Response Error Logic (The Refresh Dance) ──
  const responseErrorInterceptor = async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401, not retried yet, and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/api/v1/auth/refresh'
    ) {

      // 1. Queue concurrent requests if a refresh is already happening
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // 2. Lock the queue and start refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getClientRefreshToken();

      // If no refresh token exists, immediately log out
      if (!refreshToken) {
        clearAuthToken();
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Create a pristine Axios instance to avoid interceptor infinite loops
        const refreshAxios = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
          headers: { "Content-Type": "application/json" }
        });

        // Ensure we respect your backend URL structure after your rewrite rules
        const response = await refreshAxios.post('/auth/refresh', {
          refresh_token: refreshToken
        });

        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        // Save new tokens. We default rememberMe to true here so it maintains the existing cookie's lifespan rules
        setAuthTokens(newAccessToken, newRefreshToken, true);

        // Update the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Release the queue for all waiting requests
        processQueue(null, newAccessToken);

        // Re-fire the original request
        return axios(originalRequest);

      } catch (refreshError: any) {
        // If the refresh token is expired or invalid: Clean up and force login
        processQueue(refreshError, null);
        clearAuthToken();
        useAuthStore.getState().logout();

        if (typeof window !== "undefined" && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        // Unlock the queue
        isRefreshing = false;
      }
    }

    // Pass through any non-401 errors seamlessly
    return Promise.reject(error);
  };

  // Attach response interceptors to both Global Axios and Orval's Instance
  axios.interceptors.response.use((response) => response, responseErrorInterceptor);
  AXIOS_INSTANCE.interceptors.response.use((response) => response, responseErrorInterceptor);
}