import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export function setupAxiosInterceptors() {
  // Set the base URL for all requests
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 1. Request Interceptor: Attach token to every outgoing request
  axios.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: Handle global 401 Unauthorized errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // If the token is expired or invalid, clear the store and force login
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}