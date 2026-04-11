// packages/orval-config/src/axios-setup.ts
import Axios, { AxiosRequestConfig } from 'axios';
import { getClientAuthToken } from '@repo/utils'; // Adjust if your export path is slightly different

// 1. Create a dedicated Axios instance
export const AXIOS_INSTANCE = Axios.create({
  // Point to your backend. In Next.js, this will pick up the public env var.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
});

// 2. Add the Interceptor
AXIOS_INSTANCE.interceptors.request.use((config) => {
  // Read the token from the cross-subdomain cookie
  const token = getClientAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Optional: Fix the double /api/v1/ bug if your baseURL already includes it
  if (config.url && config.url.startsWith('/api/v1/')) {
    config.url = config.url.replace('/api/v1/', '/');
  }

  return config;
});

// 3. Export the Custom Mutator Function for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);
};