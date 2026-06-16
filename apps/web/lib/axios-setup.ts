import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getClientAuthToken,
  getClientRefreshToken,
  setAuthTokens,
  clearAuthToken,
  getClientIdToken
} from '@repo/utils';
import { jwtDecode } from 'jwt-decode';

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

    const isAzure = config.url && (
      config.url.includes("blob.core.windows.net") || 
      config.url.includes("127.0.0.1:10000") || 
      config.url.includes("localhost:10000")
    );

    if (token && !isAzure) {
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

      // Determine if the user is a candidate (checks roles and fallback path)
      let isCandidateUser = false;
      try {
        const token = getClientAuthToken();
        if (token) {
          const decoded: any = jwtDecode(token);
          isCandidateUser = !!decoded?.realm_access?.roles?.includes("candidate");
        }
      } catch (e) {
        if (typeof window !== "undefined") {
          isCandidateUser = window.location.pathname.includes("/candidate") || window.location.pathname.includes("/job");
        }
      }
      if (!isCandidateUser && typeof window !== "undefined") {
        isCandidateUser = window.location.pathname.includes("/candidate") || window.location.pathname.includes("/job");
      }

      // DEBUG: log which URL triggered the 401
      console.warn('[Auth] 401 received on:', originalRequest.url, '— attempting token refresh');

      const refreshToken = getClientRefreshToken();

      // If no refresh token exists, immediately log out
      if (!refreshToken) {
        clearAuthToken();
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const decoded: { exp: number } = jwtDecode(refreshToken);
        if (decoded.exp * 1000 < Date.now()) {
          // Refresh token is already expired — no point calling the endpoint
          clearAuthToken();
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      } catch {
        // Malformed token — clear and bail
        clearAuthToken();
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        // Create a pristine Axios instance to avoid interceptor infinite loops
        const refreshAxios = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
          headers: { "Content-Type": "application/json" }
        });

        // Ensure we respect your backend URL structure after your rewrite rules
        const refreshUrl = isCandidateUser ? '/candidate/auth/refresh' : '/auth/refresh';
        const response = await refreshAxios.post(refreshUrl, {
          refresh_token: refreshToken
        });

        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        const idToken: any = getClientIdToken();

        // Save new tokens. We default rememberMe to true here so it maintains the existing cookie's lifespan rules
        setAuthTokens(newAccessToken, newRefreshToken, idToken, "", true);

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