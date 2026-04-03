// apps/web/lib/axios-setup.ts
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getClientAuthToken } from '@repo/utils';
// 1. Import the isolated Orval instance
import { AXIOS_INSTANCE } from '@repo/orval-config/src/axios-setup';

export function setupAxiosInterceptors() {
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ── Global Axios Request Interceptor ──
  axios.interceptors.request.use(
    (config) => {
      const token = getClientAuthToken();
      if (config.url && config.url.startsWith('/api/v1/')) {
        config.url = config.url.replace('/api/v1/', '/');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ── 401 Redirect Logic ──
  const handleUnauthorized = (error: any) => {
    if (error.response?.status === 401) {
      // Always clear the store on a 401
      useAuthStore.getState().logout();

      // ONLY redirect if they are not already on the login page
      if (typeof window !== "undefined" && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  };

  // 2. Attach the response interceptor to Global Axios (for manual calls)
  axios.interceptors.response.use((response) => response, handleUnauthorized);

  // 3. Attach the exact SAME interceptor to Orval's instance (for generated hooks)
  AXIOS_INSTANCE.interceptors.response.use((response) => response, handleUnauthorized);
}